import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const auditAcaoEnum = pgEnum("audit_acao", ["criar", "visualizar", "exportar", "anonimizar"]);
export const auditEntidadeEnum = pgEnum("audit_entidade", ["prontuario", "receita", "atestado", "paciente"]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  acao: auditAcaoEnum("acao").notNull(),
  entidade: auditEntidadeEnum("entidade").notNull(),
  entidadeId: text("entidade_id").notNull(),
  pacienteId: text("paciente_id"),
  detalhe: text("detalhe"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("audit_logs_tenant_id_idx").on(table.tenantId),
  pacienteIdx: index("audit_logs_paciente_id_idx").on(table.pacienteId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
