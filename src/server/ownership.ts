/**
 * Confirma que um paciente e um profissional pertencem ao tenant informado antes de
 * vincular um registro clínico a eles. Sem essa checagem, um id de outro tenant
 * (adivinhado ou vazado) seria aceito silenciosamente — ver histórico de IDOR corrigido
 * em salvarAgendamento/salvarProntuario/salvarReceita/salvarAtestado.
 */
export async function assertPacienteEProfissional(tenantId: string, pacienteId: string, professionalId: string) {
  const { db } = await import("~/db");
  const { eq, and } = await import("drizzle-orm");
  const { patients, professionals } = await import("~/db/schema");
  const [paciente, profissional] = await Promise.all([
    db.query.patients.findFirst({ where: and(eq(patients.id, pacienteId), eq(patients.tenantId, tenantId)), columns: { id: true } }),
    db.query.professionals.findFirst({ where: and(eq(professionals.id, professionalId), eq(professionals.tenantId, tenantId)), columns: { id: true } }),
  ]);
  if (!paciente || !profissional) throw new Error("Paciente ou profissional inválido.");
}
