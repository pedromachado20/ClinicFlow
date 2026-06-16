import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency } from "~/lib/utils";

const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and, gte, sql, count } = await import("drizzle-orm");
  const { appointments, patients, transacoes } = await import("~/db/schema");

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [totalPacientes, consultasHoje, receitaMes, consultasMes] = await Promise.all([
    db.select({ count: count() }).from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.ativo, true))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje))),
    db.select({ total: sql<string>`coalesce(sum(valor), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes))),
  ]);

  const totalConsultasMes = consultasMes[0]?.count ?? 0;
  const totalConsultasHoje = consultasHoje[0]?.count ?? 0;
  const concluidas = await db.select({ count: count() }).from(appointments).where(
    and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes), eq(appointments.status, "concluido"))
  );
  const taxaComparecimento = totalConsultasMes > 0
    ? Math.round(((concluidas[0]?.count ?? 0) / totalConsultasMes) * 100)
    : 0;

  const proximasConsultas = await db.query.appointments.findMany({
    where: and(eq(appointments.tenantId, tenantId), gte(appointments.data, hoje)),
    with: { paciente: true, professional: true, service: true },
    orderBy: (a, { asc }) => [asc(a.data), asc(a.horaInicio)],
    limit: 6,
  });

  return {
    totalPacientes: totalPacientes[0]?.count ?? 0,
    consultasHoje: totalConsultasHoje,
    receitaMes: parseFloat(receitaMes[0]?.total ?? "0"),
    taxaComparecimento,
    proximasConsultas,
  };
});

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const statusColors: Record<string, string> = {
  agendado: "text-muted-foreground",
  confirmado: "text-primary",
  em_atendimento: "text-warning",
  concluido: "text-success",
  cancelado: "text-destructive",
  faltou: "text-destructive",
  remarcado: "text-muted-foreground",
};

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    refetchOnMount: "always",
  });

  const kpis = [
    { label: "Consultas Hoje", value: data?.consultasHoje ?? 0, icon: CalendarDays, color: "text-primary" },
    { label: "Pacientes Ativos", value: data?.totalPacientes ?? 0, icon: Users, color: "text-info" },
    { label: "Receita do Mês", value: formatCurrency(data?.receitaMes ?? 0), icon: DollarSign, color: "text-success" },
    { label: "Taxa de Comparecimento", value: `${data?.taxaComparecimento ?? 0}%`, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bem-vindo ao ClinicFlow</h2>
        <p className="text-sm text-muted-foreground">Resumo da sua clínica</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isLoading ? "..." : kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !data?.proximasConsultas.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada</p>
          ) : (
            <div className="space-y-3">
              {data.proximasConsultas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{a.paciente?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.service?.nome} · {a.professional?.nome} · {a.data} {a.horaInicio}
                    </p>
                  </div>
                  <span className={`text-xs capitalize font-medium ${statusColors[a.status] ?? "text-muted-foreground"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
