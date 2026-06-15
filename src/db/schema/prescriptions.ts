import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { patients } from "./patients";
import { professionals } from "./professionals";
import { records } from "./records";

export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  pacienteId: text("paciente_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  professionalId: text("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  recordId: text("record_id").references(() => records.id, { onDelete: "set null" }),
  data: text("data").notNull(),
  medicamentos: text("medicamentos").notNull().default("[]"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;
