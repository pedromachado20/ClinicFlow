import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const clinicTypeEnum = pgEnum("clinic_type", [
  "clinica_medica",
  "consultorio_dentario",
  "consultorio_psicologia",
  "clinica_fisioterapia",
  "outro",
]);

export const tenantPlanEnum = pgEnum("tenant_plan_clinic", ["trial", "basico", "pro", "premium"]);
export const tenantStatusEnum = pgEnum("tenant_status_clinic", ["ativo", "inativo", "trial", "suspenso"]);

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: clinicTypeEnum("tipo").notNull().default("clinica_medica"),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cidade: text("cidade"),
  estado: text("estado"),
  cnpj: text("cnpj"),
  cnes: text("cnes"),
  planoSaas: tenantPlanEnum("plano_saas").notNull().default("trial"),
  status: tenantStatusEnum("status").notNull().default("trial"),
  // WhatsApp
  whatsappAtivo: boolean("whatsapp_ativo").notNull().default(false),
  whatsappProvider: text("whatsapp_provider").default("nenhum"),
  evolutionApiUrl: text("evolution_api_url"),
  evolutionApiKey: text("evolution_api_key"),
  evolutionInstance: text("evolution_instance"),
  zapiClientToken: text("zapi_client_token"),
  // Notificações
  notifAgendamento: boolean("notif_agendamento").notNull().default(false),
  notifLembrete: boolean("notif_lembrete").notNull().default(false),
  ativo: boolean("ativo").notNull().default(true),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
