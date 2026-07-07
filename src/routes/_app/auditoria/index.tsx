import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { requireAdminRoute } from "~/lib/utils";

const getAuditoria = createServerFn({ method: "GET" })
  .validator(z.object({ pacienteId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { eq, and } = await import("drizzle-orm");
    const { auditLogs } = await import("~/db/schema");

    return db.query.auditLogs.findMany({
      where: and(eq(auditLogs.tenantId, tenantId), data?.pacienteId ? eq(auditLogs.pacienteId, data.pacienteId) : undefined),
      with: { user: { columns: { name: true } }, paciente: { columns: { nome: true } } },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: 300,
    });
  });

const ACAO_LABEL: Record<string, string> = {
  criar: "Criou",
  visualizar: "Visualizou",
  exportar: "Exportou",
  anonimizar: "Anonimizou",
};

const ENTIDADE_LABEL: Record<string, string> = {
  prontuario: "prontuário",
  receita: "receita",
  atestado: "atestado",
  paciente: "dados do paciente",
};

export const Route = createFileRoute("/_app/auditoria/")({
  beforeLoad: requireAdminRoute,
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const [busca, setBusca] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["auditoria"],
    queryFn: () => getAuditoria({ data: {} }),
  });

  const filtrado = data.filter((l) =>
    !busca || (l.paciente?.nome ?? "").toLowerCase().includes(busca.toLowerCase()) || (l.user?.name ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Log de Auditoria</CardTitle>
          <CardDescription>
            Registro de quem criou ou visualizou dados clínicos de cada paciente (LGPD Art. 37). Mostra as últimas 300 ações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8" placeholder="Filtrar por paciente ou usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !filtrado.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Data/Hora</th>
                    <th className="py-2 pr-3 font-medium">Usuário</th>
                    <th className="py-2 pr-3 font-medium">Ação</th>
                    <th className="py-2 pr-3 font-medium">Paciente</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((l) => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(l.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-3">{l.user?.name ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{ACAO_LABEL[l.acao] ?? l.acao} {ENTIDADE_LABEL[l.entidade] ?? l.entidade}</Badge>
                      </td>
                      <td className="py-2 pr-3">{l.paciente?.nome ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
