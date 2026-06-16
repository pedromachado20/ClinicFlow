import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCurrency } from "~/lib/utils";

const getRelatorios = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and, gte, sql, count } = await import("drizzle-orm");
  const { appointments, patients, transacoes, services } = await import("~/db/schema");

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [totalPacientes, totalConsultas, receitaMes, concluidas, topServicos, porProfissional, tipoAtendimento] = await Promise.all([
    db.select({ count: count() }).from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.ativo, true))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes))),
    db.select({ total: sql<string>`coalesce(sum(valor), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),
    db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes), eq(appointments.status, "concluido"))),
    db.select({ nome: services.nome, total: count() })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(services.nome)
      .orderBy(sql`count(*) desc`)
      .limit(5),
    db.select({ profissional: sql<string>`professional_id`, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(sql`professional_id`)
      .orderBy(sql`count(*) desc`)
      .limit(5),
    db.select({ tipo: appointments.tipoAtendimento, total: count() })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), gte(appointments.data, inicioMes)))
      .groupBy(appointments.tipoAtendimento),
  ]);

  const totalConsultasMes = totalConsultas[0]?.count ?? 0;
  const taxaComparecimento = totalConsultasMes > 0
    ? Math.round(((concluidas[0]?.count ?? 0) / totalConsultasMes) * 100)
    : 0;

  return {
    totalPacientes: totalPacientes[0]?.count ?? 0,
    totalConsultas: totalConsultasMes,
    receitaMes: parseFloat(receitaMes[0]?.total ?? "0"),
    taxaComparecimento,
    topServicos,
    tipoAtendimento,
  };
});

export const Route = createFileRoute("/_app/relatorios/")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["relatorios"],
    queryFn: () => getRelatorios(),
    refetchOnMount: "always",
  });

  const kpis = [
    { label: "Pacientes Ativos",      value: data?.totalPacientes ?? 0,    icon: Users },
    { label: "Consultas no Mês",      value: data?.totalConsultas ?? 0,    icon: CalendarDays },
    { label: "Receita do Mês",        value: formatCurrency(data?.receitaMes ?? 0), icon: BarChart3 },
    { label: "Taxa de Comparecimento", value: `${data?.taxaComparecimento ?? 0}%`, icon: TrendingUp },
  ];

  const maxTop = Math.max(...(data?.topServicos.map((s) => s.total) ?? [1]), 1);
  const particular = data?.tipoAtendimento.find((t) => t.tipo === "particular")?.total ?? 0;
  const convenio = data?.tipoAtendimento.find((t) => t.tipo === "convenio")?.total ?? 0;
  const totalTipo = particular + convenio || 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isLoading ? "..." : k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Serviços do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !data?.topServicos.length ? (
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
            <CardTitle className="text-base">Tipo de Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Particular</span>
                <span className="text-muted-foreground">{particular} ({Math.round((particular / totalTipo) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(particular / totalTipo) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Convênio</span>
                <span className="text-muted-foreground">{convenio} ({Math.round((convenio / totalTipo) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(convenio / totalTipo) * 100}%` }} />
              </div>
            </div>
            <div className="border-t border-border pt-3 text-sm text-muted-foreground">
              Total: {particular + convenio} atendimento{(particular + convenio) !== 1 ? "s" : ""} no mês
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-success">{isLoading ? "..." : formatCurrency(data?.receitaMes ?? 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Taxa de comparecimento: <span className="text-foreground font-medium">{data?.taxaComparecimento ?? 0}%</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
