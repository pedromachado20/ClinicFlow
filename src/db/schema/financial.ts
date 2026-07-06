import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const transacoes = pgTable("transacoes", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  categoria: text("categoria").notNull(),
  descricao: text("descricao").notNull(),
  valor: text("valor").notNull(),
  data: text("data").notNull(),
  pago: boolean("pago").notNull().default(true),
  status: text("status").notNull().default("pago"),
  referencia: text("referencia"),
  pacienteId: text("paciente_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantDataIdx: index("transacoes_tenant_id_data_idx").on(table.tenantId, table.data),
}));

export type Transacao = typeof transacoes.$inferSelect;
export type NewTransacao = typeof transacoes.$inferInsert;
