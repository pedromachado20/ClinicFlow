/**
 * Envia mensagem de WhatsApp para um número usando o provedor configurado no tenant.
 * Retorna silenciosamente se não configurado ou se o número estiver vazio.
 */
export async function enviarWhatsapp(tenantId: string, numero: string | null | undefined, mensagem: string) {
  if (!numero) return;

  const { db } = await import("~/db");
  const { eq } = await import("drizzle-orm");
  const { tenants } = await import("~/db/schema");

  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  if (!tenant?.whatsappAtivo || !tenant.whatsappProvider || tenant.whatsappProvider === "nenhum") return;

  const tel = numero.replace(/\D/g, "");
  if (tel.length < 10) return;

  const { decryptSecret } = await import("~/server/crypto");
  const evolutionApiKey = decryptSecret(tenant.evolutionApiKey);
  const zapiClientToken = decryptSecret(tenant.zapiClientToken);

  try {
    if (tenant.whatsappProvider === "z-api") {
      await fetch(
        `${tenant.evolutionApiUrl}/instances/${tenant.evolutionInstance}/token/${evolutionApiKey}/send-text`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Client-Token": zapiClientToken ?? "" },
          body: JSON.stringify({ phone: `55${tel}`, message: mensagem }),
        }
      );
    } else if (tenant.whatsappProvider === "evolution") {
      await fetch(
        `${tenant.evolutionApiUrl}/message/sendText/${tenant.evolutionInstance}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionApiKey ?? "" },
          body: JSON.stringify({ number: `55${tel}`, text: mensagem }),
        }
      );
    }
  } catch {
    // Falha silenciosa — não impede o agendamento
  }
}
