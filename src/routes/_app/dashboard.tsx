import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users, DollarSign, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency, hojeLocal, primeiroDiaMesLocal } from "~/lib/utils";

const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and, gte, sql, asc } = await import("drizzle-orm");
  const { appointments, patients, transacoes, professionals, services } = await import("~/db/schema");

  const hoje = hojeLocal();
  const inicioMes = primeiroDiaMesLocal();

  // Usa sql`` com literais inline para colunas pgEnum — evita bug de cast text→enum no Neon HTTP
  const [pacTotal, mesStat, receitaMes, hojeStat, proximas] = await Promise.all([
    db.select({ n: sql<string>`count(*)` })
      .from(patients)
      .where(and(eq(patients.tenantId, tenantId), sql`${patients.ativo} = true`)),

    db.select({
      total:      sql<string>`count(*)`,
      concluidas: sql<string>`count(*) filter (where status = 'concluido')`,
      particular: sql<string>`count(*) filter (where tipo_atendimento = 'particular')`,
      convenio:   sql<string>`count(*) filter (where tipo_atendimento = 'convenio')`,
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes))),

    db.select({ total: sql<string>`coalesce(sum(valor::numeric), 0)` })
      .from(transacoes)
      .where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),

    db.select({
      total:      sql<string>`count(*)`,
      particular: sql<string>`count(*) filter (where tipo_atendimento = 'particular')`,
      convenio:   sql<string>`count(*) filter (where tipo_atendimento = 'convenio')`,
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje))),

    db.select({
      id:              appointments.id,
      data:            appointments.data,
      horaInicio:      appointments.horaInicio,
      status:          sql<string>`${appointments.status}::text`,
      tipoAtendimento: sql<string>`${appointments.tipoAtendimento}::text`,
      pacienteNome:    patients.nome,
      profissionalNome: professionals.nome,
      serviceNome:     services.nome,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.pacienteId, patients.id))
    .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, hoje)))
    .orderBy(asc(appointments.data), asc(appointments.horaInicio))
    .limit(6),
  ]);

  const int = (v?: string | null) => parseInt(v ?? "0", 10);
  const totalConsultasMes = int(mesStat[0]?.total);
  const concluidas = int(mesStat[0]?.concluidas);

  return {
    totalPacientes:   int(pacTotal[0]?.n),
    consultasHoje:    int(hojeStat[0]?.total),
    totalConsultasMes,
    receitaMes:       parseFloat(receitaMes[0]?.total ?? "0"),
    taxaComparecimento: totalConsultasMes > 0 ? Math.round((concluidas / totalConsultasMes) * 100) : 0,
    particularHoje:   int(hojeStat[0]?.particular),
    convenioHoje:     int(hojeStat[0]?.convenio),
    particularMes:    int(mesStat[0]?.particular),
    convenioMes:      int(mesStat[0]?.convenio),
    proximasConsultas: proximas,
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
