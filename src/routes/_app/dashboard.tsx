import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users, DollarSign, TrendingUp, Activity } from "lucide-react";
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

  const [totalPacientes, consultasHoje, receitaMes, consultasMes, particularHoje, convenioHoje, particularMes, convenioMes] = await Promise.all([
    db.select({ count: count() }).from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.ativo, true))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje))),
    db.select({ total: sql<string>`coalesce(sum(valor), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje), eq(appointments.tipoAtendimento, "particular"))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje), eq(appointments.tipoAtendimento, "convenio"))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes), eq(appointments.tipoAtendimento, "particular"))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes), eq(appointments.tipoAtendimento, "convenio"))),
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
    totalConsultasMes,
    receitaMes: parseFloat(receitaMes[0]?.total ?? "0"),
    taxaComparecimento,
    particularHoje: particularHoje[0]?.count ?? 0,
    convenioHoje: convenioHoje[0]?.count ?? 0,
    particularMes: particularMes[0]?.count ?? 0,
    convenioMes: convenioMes[0]?.count ?? 0,
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
  });

  const val = (v: number | string) => isLoading ? "..." : v;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bem-vindo ao ClinicFlow</h2>
        <p className="text-sm text-muted-foreground">Resumo da sua clínica</p>
      </div>

      {/* KPIs principais */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Hoje</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{val(data?.consultasHoje ?? 0)}</p>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-1">
                {data?.particularHoje ?? 0} particular · {data?.convenioHoje ?? 0} convênio
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultas no Mês</CardTitle>
            <Activity className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{val(data?.totalConsultasMes ?? 0)}</p>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-1">
                {data?.particularMes ?? 0} particular · {data?.convenioMes ?? 0} convênio
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{val(data?.totalPacientes ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{val(formatCurrency(data?.receitaMes ?? 0))}</p>
            <p className="text-xs text-muted-foreground mt-1">Apenas particular</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Comparecimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{val(`${data?.taxaComparecimento ?? 0}%`)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Consultas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !data?.proximasConsultas?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada</p>
          ) : (
            <div className="space-y-3">
              {data.proximasConsultas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{a.paciente?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.service?.nome} · {a.professional?.nome} · {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")} {a.horaInicio}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {a.tipoAtendimento === "convenio" ? "Convênio" : "Particular"}
                    </span>
                    <span className={`text-xs capitalize font-medium ${statusColors[a.status] ?? "text-muted-foreground"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
