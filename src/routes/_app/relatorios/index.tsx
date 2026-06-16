import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, CalendarDays, Sun, Activity, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency } from "~/lib/utils";

const getRelatorios = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and, gte, sql, count } = await import("drizzle-orm");
  const { appointments, patients, transacoes, services } = await import("~/db/schema");

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  // groupBy evita comparação de parâmetro text com coluna pgEnum (bug do driver Neon HTTP)
  const [
    totalPacientes,
    totalConsultas,
    receitaMes,
    porStatusMes,
    topServicos,
    porTipoMes,
    porTipoHoje,
    receitaHoje,
  ] = await Promise.all([
    db.select({ count: count() }).from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.ativo, true))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes))),
    db.select({ total: sql<string>`coalesce(sum(valor), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),
    db.select({ status: appointments.status, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(appointments.status),
    db.select({ nome: services.nome, total: count() })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(services.nome)
      .orderBy(sql`count(*) desc`)
      .limit(5),
    db.select({ tipo: appointments.tipoAtendimento, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(appointments.tipoAtendimento),
    db.select({ tipo: appointments.tipoAtendimento, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.data, hoje)))
      .groupBy(appointments.tipoAtendimento),
    db.select({ total: sql<string>`coalesce(sum(valor), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), eq(transacoes.data, hoje))),
  ]);

  const totalConsultasMes = totalConsultas[0]?.count ?? 0;
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
    totalConsultas: totalConsultasMes,
    receitaMes: parseFloat(receitaMes[0]?.total ?? "0"),
    taxaComparecimento,
    topServicos,
    tipoAtendimento: porTipoMes,
    consultasHoje,
    receitaHoje: parseFloat(receitaHoje[0]?.total ?? "0"),
    particularHoje,
    convenioHoje,
    particularMes,
    convenioMes,
  };
});

export const Route = createFileRoute("/_app/relatorios/")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["relatorios"],
    queryFn: () => getRelatorios(),
  });

  const val = (v: string | number) => isLoading ? "..." : v;

  const maxTop = Math.max(...(data?.topServicos?.map((s) => s.total) ?? [1]), 1);
  const particular = data?.tipoAtendimento?.find((t) => t.tipo === "particular")?.total ?? 0;
  const convenio = data?.tipoAtendimento?.find((t) => t.tipo === "convenio")?.total ?? 0;
  const totalTipo = particular + convenio || 1;

  return (
    <div className="space-y-6">
      {/* KPIs do Dia */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Hoje</p>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Consultas Hoje</CardTitle>
              <Sun className="h-4 w-4 text-primary" />
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
              <CardTitle className="text-sm text-muted-foreground">Receita Hoje</CardTitle>
              <Sun className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{val(formatCurrency(data?.receitaHoje ?? 0))}</p>
              <p className="text-xs text-muted-foreground mt-1">Lançamentos do dia</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Particular Hoje</CardTitle>
              <Stethoscope className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{val(data?.particularHoje ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">atendimentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Convênio Hoje</CardTitle>
              <Activity className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{val(data?.convenioHoje ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">repasse posterior</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPIs do Mês */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Mês Atual</p>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pacientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{val(data?.totalPacientes ?? 0)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Consultas no Mês</CardTitle>
              <CalendarDays className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{val(data?.totalConsultas ?? 0)}</p>
              {!isLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.particularMes ?? 0} particular · {data?.convenioMes ?? 0} convênio
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Receita do Mês</CardTitle>
              <BarChart3 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{val(formatCurrency(data?.receitaMes ?? 0))}</p>
              <p className="text-xs text-muted-foreground mt-1">Apenas particular</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Taxa de Comparecimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{val(`${data?.taxaComparecimento ?? 0}%`)}</p></CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Serviços do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !data?.topServicos?.length ? (
              <p className="text-sm text-muted-foreground">Sem consultas este mês</p>
            ) : (
              <div className="space-y-3">
                {data.topServicos.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">#{i + 1} {s.nome ?? "Serviço removido"}</span>
                      <span className="text-muted-foreground">{s.total} vez{s.total !== 1 ? "es" : ""}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(s.total / maxTop) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Particular vs Convênio — Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Particular</span>
                <span className="text-muted-foreground">{particular} atend. ({Math.round((particular / totalTipo) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(particular / totalTipo) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Convênio</span>
                <span className="text-muted-foreground">{convenio} atend. ({Math.round((convenio / totalTipo) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(convenio / totalTipo) * 100}%` }} />
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-1 text-sm text-muted-foreground">
              <p>Total: {particular + convenio} atendimento{(particular + convenio) !== 1 ? "s" : ""} no mês</p>
              <p className="text-xs">Receita de convênio é repassada posteriormente pelos planos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-3xl font-bold text-success">{isLoading ? "..." : formatCurrency(data?.receitaMes ?? 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Receita registrada (particular) · Taxa de comparecimento:{" "}
              <span className="text-foreground font-medium">{data?.taxaComparecimento ?? 0}%</span>
            </p>
          </div>
          {!isLoading && (data?.convenioMes ?? 0) > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
              {data?.convenioMes} atendimento{(data?.convenioMes ?? 0) !== 1 ? "s" : ""} de convênio este mês —
              valor a receber conforme repasse dos planos de saúde
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
