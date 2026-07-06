import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import type { UserRole } from "~/server/context";

const getAssinatura = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { tenantId } = await requireTenant();
  const { db } = await import("~/db");
  const { eq } = await import("drizzle-orm");
  const { tenants } = await import("~/db/schema");
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { nome: true, planoSaas: true, status: true, trialEndsAt: true, asaasSubscriptionId: true },
  });
  const { SUBSCRIPTION_PRICE } = await import("~/lib/billing");
  return { ...tenant, preco: SUBSCRIPTION_PRICE };
});

const assinarAgora = createServerFn({ method: "POST" }).handler(async () => {
  const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
  const { tenantId, userRole } = await requireTenant();
  requireRole(userRole, ADMIN_ROLES);
  const { db } = await import("~/db");
  const { eq } = await import("drizzle-orm");
  const { tenants } = await import("~/db/schema");
  const { criarCliente, criarAssinatura, buscarPrimeiraFatura } = await import("~/server/asaas");
  const { SUBSCRIPTION_PRICE } = await import("~/lib/billing");

  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  if (!tenant) throw new Error("Clínica não encontrada");
  if (tenant.asaasSubscriptionId) throw new Error("Já existe uma assinatura ativa");
  if (!tenant.cnpj) throw new Error("Preencha o CPF ou CNPJ da clínica em Configurações antes de assinar");

  let customerId = tenant.asaasCustomerId;
  if (!customerId) {
    const cliente = await criarCliente({ nome: tenant.nome, email: tenant.email, telefone: tenant.telefone ?? undefined, cpfCnpj: tenant.cnpj });
    customerId = cliente.id;
    await db.update(tenants).set({ asaasCustomerId: customerId, updatedAt: new Date() }).where(eq(tenants.id, tenantId));
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const assinatura = await criarAssinatura({
    customerId,
    valor: SUBSCRIPTION_PRICE,
    vencimento: hoje,
    descricao: "Assinatura ClinicFlow",
  });

  await db.update(tenants)
    .set({ asaasCustomerId: customerId, asaasSubscriptionId: assinatura.id, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  const fatura = await buscarPrimeiraFatura(assinatura.id).catch(() => undefined);
  return { invoiceUrl: fatura?.invoiceUrl };
});

export const Route = createFileRoute("/_app/assinatura/")({
  component: AssinaturaPage,
});

function AssinaturaPage() {
  const qc = useQueryClient();
  const { userRole } = useRouteContext({ from: "/_app" }) as { userRole?: UserRole };
  const isAdmin = userRole === "owner" || userRole === "admin";
  const { data, isLoading } = useQuery({ queryKey: ["assinatura"], queryFn: () => getAssinatura() });

  const assinarMut = useMutation({
    mutationFn: () => assinarAgora(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["assinatura"] });
      if (res.invoiceUrl) {
        toast.success("Assinatura criada! Abrindo fatura para pagamento...");
        window.open(res.invoiceUrl, "_blank");
      } else {
        toast.success("Assinatura criada!");
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar assinatura"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const trialEndsAt = data?.trialEndsAt ? new Date(data.trialEndsAt) : null;
  const diasRestantes = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Assinatura</CardTitle>
            <CardDescription className="mt-1">Status do plano do ClinicFlow para {data?.nome}</CardDescription>
          </div>
          {data?.status === "ativo" && <Badge variant="success">Ativo</Badge>}
          {data?.status === "trial" && <Badge variant="secondary">Trial</Badge>}
          {data?.status === "suspenso" && <Badge variant="destructive">Suspenso</Badge>}
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.status === "trial" && !data?.asaasSubscriptionId && (
            <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 p-4">
              <Clock className="h-5 w-5 text-info shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">
                  {diasRestantes !== null ? `${diasRestantes} dia(s) restante(s) no período de teste` : "Período de teste em andamento"}
                </p>
                <p className="text-muted-foreground mt-1">Sem cartão de crédito necessário durante o trial.</p>
              </div>
            </div>
          )}

          {data?.asaasSubscriptionId && (
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm">Assinatura criada. Acompanhe o pagamento pelo link enviado pelo Asaas.</p>
            </div>
          )}

          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium">Plano Mensal</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data?.preco ?? 0)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mt-2">
              <li>• Agenda, prontuários, financeiro e caixa ilimitados</li>
              <li>• Integração com WhatsApp</li>
              <li>• Suporte por e-mail</li>
            </ul>
          </div>

          {!data?.asaasSubscriptionId && isAdmin && (
            <Button className="w-full" disabled={assinarMut.isPending} onClick={() => assinarMut.mutate()}>
              <CreditCard className="h-4 w-4" />
              {assinarMut.isPending ? "Criando assinatura..." : "Quero assinar agora"}
            </Button>
          )}
          {!data?.asaasSubscriptionId && !isAdmin && (
            <p className="text-sm text-muted-foreground text-center">Fale com o administrador da clínica para assinar o plano.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
