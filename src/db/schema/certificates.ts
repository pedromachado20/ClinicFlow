import { pgTable, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { patients } from "./patients";
import { professionals } from "./professionals";
import { records } from "./records";

export const certTipoEnum = pgEnum("cert_tipo", [
  "afastamento",
  "comparecimento",
  "escolar",
]);

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  pacienteId: text("paciente_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  professionalId: text("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  recordId: text("record_id").references(() => records.id, { onDelete: "set null" }),
  tipo: certTipoEnum("tipo").notNull().default("afastamento"),
  diasAfastamento: integer("dias_afastamento").notNull().default(1),
  dataInicio: text("data_inicio").notNull(),
  dataFim: text("data_fim").notNull(),
  cid: text("cid"),
  motivo: text("motivo"),
  cidade: text("cidade"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("certificates_tenant_id_idx").on(table.tenantId),
  pacienteIdx: index("certificates_paciente_id_idx").on(table.pacienteId),
}));

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
