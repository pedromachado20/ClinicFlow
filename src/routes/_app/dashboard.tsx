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
  const { eq, and, gte, sql, count, asc } = await import("drizzle-orm");
  const { appointments, patients, transacoes, professionals, services } = await import("~/db/schema");

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  // groupBy evita comparação de parâmetro text com coluna pgEnum (bug do driver Neon HTTP)
  const [totalPacientes, porStatusMes, receitaMes, porTipoHoje, porTipoMes, proximasConsultas] = await Promise.all([
    db.select({ count: count() }).from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.ativo, true))),
    db.select({ status: appointments.status, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(appointments.status),
    db.select({ total: sql<string>`coalesce(sum(valor), 0)` }).from(transacoes)
      .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),
    db.select({ tipo: appointments.tipoAtendimento, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje)))
      .groupBy(appointments.tipoAtendimento),
    db.select({ tipo: appointments.tipoAtendimento, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(appointments.tipoAtendimento),
    db.select({
      id: appointments.id,
      data: appointments.data,
      horaInicio: appointments.horaInicio,
      status: appointments.status,
      tipoAtendimento: appointments.tipoAtendimento,
      pacienteNome: patients.nome,
      profissionalNome: professionals.nome,
      serviceNome: services.nome,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.pacienteId, patients.id))
    .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, hoje)))
    .orderBy(asc(appointments.data), asc(appointments.horaInicio))
    .limit(6),
  ]);

  const totalConsultasMes = porStatusMes.reduce((acc, s) => acc + s.total, 0);
  const concluidas = porStatusMes.find((s) => s.status === "concluido")?.total ?? 0;
  const taxaComparecimento = totalConsultasMes > 0
    ? Math.round((concluidas / totalConsultasMes) * 100)
    : 0;

  const consultasHoje = porTipoHoje.reduce((acc, t) => acc + t.total, 0);
  const particularHoje = porTipoHoje.find((t) => t.tipo === "particular")?.total ?? 0;
  const convenioHoje = porTipoHoje.find((t) => t.tipo === "convenio")?.total ?? 0;
  const particularMes = porTipoMes.find((t) => t.tipo === "particular")?.total ?? 0;
  const convenioMes = porTipoMes.find((t) => t.tipo === "convenio")?.total ?? 0;

  return {
    totalPacientes: totalPacientes[0]?.count ?? 0,
    consultasHoje,
    totalConsultasMes,
    receitaMes: parseFloat(receitaMes[0]?.total ?? "0"),
    taxaComparecimento,
    particularHoje,
    convenioHoje,
    particularMes,
    convenioMes,
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
                    <p className="font-medium text-sm">{a.pacienteNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.serviceNome} · {a.profissionalNome} · {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")} {a.horaInicio}
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
