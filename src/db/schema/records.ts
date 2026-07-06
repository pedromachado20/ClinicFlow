import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { patients } from "./patients";
import { professionals } from "./professionals";
import { appointments } from "./appointments";

export const records = pgTable("records", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  pacienteId: text("paciente_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  professionalId: text("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  appointmentId: text("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  data: text("data").notNull(),
  queixaPrincipal: text("queixa_principal"),
  historicoClinico: text("historico_clinico"),
  exameClinico: text("exame_clinico"),
  diagnostico: text("diagnostico"),
  cid: text("cid"),
  conduta: text("conduta"),
  retorno: text("retorno"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("records_tenant_id_idx").on(table.tenantId),
  pacienteIdx: index("records_paciente_id_idx").on(table.pacienteId),
}));

export type Record_ = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
