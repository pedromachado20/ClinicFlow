import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { patients } from "./patients";
import { professionals } from "./professionals";
import { services } from "./services";

export const apptStatusEnum = pgEnum("appt_status", [
  "agendado",
  "confirmado",
  "em_atendimento",
  "concluido",
  "cancelado",
  "faltou",
  "remarcado",
]);

export const tipoAtendimentoEnum = pgEnum("tipo_atendimento", [
  "particular",
  "convenio",
]);

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  pacienteId: text("paciente_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  professionalId: text("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  serviceId: text("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  horaInicio: text("hora_inicio").notNull(),
  horaFim: text("hora_fim").notNull(),
  status: apptStatusEnum("status").notNull().default("agendado"),
  tipoAtendimento: tipoAtendimentoEnum("tipo_atendimento").notNull().default("particular"),
  convenio: text("convenio"),
  preco: text("preco").notNull().default("0"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
