CREATE INDEX "user_tenant_id_idx" ON "user" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "professionals_tenant_id_idx" ON "professionals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "patients_tenant_id_idx" ON "patients" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "services_tenant_id_idx" ON "services" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "appointments_tenant_id_data_idx" ON "appointments" USING btree ("tenant_id","data");--> statement-breakpoint
CREATE INDEX "appointments_paciente_id_idx" ON "appointments" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "appointments_professional_id_idx" ON "appointments" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "records_tenant_id_idx" ON "records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "records_paciente_id_idx" ON "records" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "prescriptions_tenant_id_idx" ON "prescriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "prescriptions_paciente_id_idx" ON "prescriptions" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "certificates_tenant_id_idx" ON "certificates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "certificates_paciente_id_idx" ON "certificates" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "transacoes_tenant_id_data_idx" ON "transacoes" USING btree ("tenant_id","data");