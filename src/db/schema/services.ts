import { pgTable, text, integer, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const servicoCategoriaEnum = pgEnum("servico_categoria", [
  "consulta",
  "retorno",
  "exame",
  "procedimento",
  "cirurgia",
  "terapia",
  "outro",
]);

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  categoria: servicoCategoriaEnum("categoria").notNull().default("consulta"),
  preco: text("preco").notNull().default("0"),
  duracao: integer("duracao").notNull().default(30),
  descricao: text("descricao"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("services_tenant_id_idx").on(table.tenantId),
}));

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
