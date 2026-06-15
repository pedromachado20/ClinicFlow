import { relations } from "drizzle-orm";
import { tenants } from "./schema/tenants";
import { users } from "./schema/users";
import { professionals } from "./schema/professionals";
import { patients } from "./schema/patients";
import { services } from "./schema/services";
import { appointments } from "./schema/appointments";
import { records } from "./schema/records";
import { prescriptions } from "./schema/prescriptions";
import { certificates } from "./schema/certificates";
import { transacoes } from "./schema/financial";

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  professionals: many(professionals),
  patients: many(patients),
  services: many(services),
  appointments: many(appointments),
  records: many(records),
  prescriptions: many(prescriptions),
  certificates: many(certificates),
  transacoes: many(transacoes),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  tenant: one(tenants, { fields: [professionals.tenantId], references: [tenants.id] }),
  appointments: many(appointments),
  records: many(records),
  prescriptions: many(prescriptions),
  certificates: many(certificates),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  tenant: one(tenants, { fields: [patients.tenantId], references: [tenants.id] }),
  appointments: many(appointments),
  records: many(records),
  prescriptions: many(prescriptions),
  certificates: many(certificates),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, { fields: [services.tenantId], references: [tenants.id] }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [appointments.tenantId], references: [tenants.id] }),
  paciente: one(patients, { fields: [appointments.pacienteId], references: [patients.id] }),
  professional: one(professionals, { fields: [appointments.professionalId], references: [professionals.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
  records: many(records),
}));

export const recordsRelations = relations(records, ({ one, many }) => ({
  tenant: one(tenants, { fields: [records.tenantId], references: [tenants.id] }),
  paciente: one(patients, { fields: [records.pacienteId], references: [patients.id] }),
  professional: one(professionals, { fields: [records.professionalId], references: [professionals.id] }),
  appointment: one(appointments, { fields: [records.appointmentId], references: [appointments.id] }),
  prescriptions: many(prescriptions),
  certificates: many(certificates),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  tenant: one(tenants, { fields: [prescriptions.tenantId], references: [tenants.id] }),
  paciente: one(patients, { fields: [prescriptions.pacienteId], references: [patients.id] }),
  professional: one(professionals, { fields: [prescriptions.professionalId], references: [professionals.id] }),
  record: one(records, { fields: [prescriptions.recordId], references: [records.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  tenant: one(tenants, { fields: [certificates.tenantId], references: [tenants.id] }),
  paciente: one(patients, { fields: [certificates.pacienteId], references: [patients.id] }),
  professional: one(professionals, { fields: [certificates.professionalId], references: [professionals.id] }),
  record: one(records, { fields: [certificates.recordId], references: [records.id] }),
}));

export const transacoesRelations = relations(transacoes, ({ one }) => ({
  tenant: one(tenants, { fields: [transacoes.tenantId], references: [tenants.id] }),
}));
