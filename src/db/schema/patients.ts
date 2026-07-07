import { pgTable, text, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const sexoEnum = pgEnum("sexo_enum", ["masculino", "feminino", "outro"]);

export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cpf: text("cpf"),
  rg: text("rg"),
  dataNascimento: text("data_nascimento"),
  sexo: sexoEnum("sexo"),
  telefone: text("telefone"),
  email: text("email"),
  convenio: text("convenio"),
  numeroConvenio: text("numero_convenio"),
  tipoSanguineo: text("tipo_sanguineo"),
  alergias: text("alergias"),
  observacoes: text("observacoes"),
  fotoUrl: text("foto_url"),
  ativo: boolean("ativo").notNull().default(true),
  // LGPD — anonimização (Art. 18 VI): dado de identificação é apagado, mas o prontuário
  // clínico vinculado ao pacienteId permanece intacto para cumprir a guarda legal do CFM.
  anonimizado: boolean("anonimizado").notNull().default(false),
  anonimizadoEm: timestamp("anonimizado_em", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("patients_tenant_id_idx").on(table.tenantId),
}));

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
