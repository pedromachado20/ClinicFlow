export type AuditAcao = "criar" | "visualizar" | "exportar" | "anonimizar";
export type AuditEntidade = "prontuario" | "receita" | "atestado" | "paciente";

/**
 * Registra quem acessou/alterou dado clínico sensível (LGPD Art. 37 — registro das
 * operações de tratamento). Nunca deve derrubar a ação principal: uma falha aqui é
 * logada no console mas não impede o médico de salvar o prontuário, por exemplo.
 */
export async function registrarAuditoria(params: {
  tenantId: string;
  userId: string;
  acao: AuditAcao;
  entidade: AuditEntidade;
  entidadeId: string;
  pacienteId?: string;
  detalhe?: string;
}) {
  try {
    const { db } = await import("~/db");
    const { auditLogs } = await import("~/db/schema");
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      userId: params.userId,
      acao: params.acao,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      pacienteId: params.pacienteId,
      detalhe: params.detalhe,
    });
  } catch (e) {
    console.error("Falha ao registrar auditoria:", e);
  }
}
