/// <reference types="vinxi/types/server" />
import { createStartAPIHandler } from "@tanstack/start-api-routes";

async function handleAsaasWebhook(request: Request): Promise<Response> {
  const token = request.headers.get("asaas-access-token");
  if (!process.env.ASAAS_WEBHOOK_TOKEN || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const body = await request.json().catch(() => null) as { event?: string; payment?: { subscription?: string } } | null;
  const subscriptionId = body?.payment?.subscription;

  if (subscriptionId && (body?.event === "PAYMENT_CONFIRMED" || body?.event === "PAYMENT_RECEIVED")) {
    const { db } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    const { tenants } = await import("~/db/schema");
    await db.update(tenants)
      .set({ status: "ativo", updatedAt: new Date() })
      .where(eq(tenants.asaasSubscriptionId, subscriptionId));
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export default createStartAPIHandler(async ({ request }) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/asaas/webhook") {
    return handleAsaasWebhook(request);
  }
  const { auth } = await import("~/lib/auth");
  const response = await auth.handler(request);
  return response;
});
