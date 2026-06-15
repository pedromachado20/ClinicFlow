import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const especialidadeEnum = pgEnum("especialidade_enum", [
  "medico",
  "dentista",
  "psicologo",
  "fisioterapeuta",
  "nutricionista",
  "enfermeiro",
  "outro",
]);

export const professionals = pgTable("professionals", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  especialidade: especialidadeEnum("especialidade").notNull().default("medico"),
  registro: text("registro"),
  conselho: text("conselho"),
  uf: text("uf"),
  telefone: text("telefone"),
  email: text("email"),
  cor: text("cor").notNull().default("#0ea5e9"),
  comissao: text("comissao"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Professional = typeof professionals.$inferSelect;
export type NewProfessional = typeof professionals.$inferInsert;
