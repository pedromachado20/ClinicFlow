CREATE TYPE "public"."audit_acao" AS ENUM('criar', 'visualizar', 'exportar', 'anonimizar');--> statement-breakpoint
CREATE TYPE "public"."audit_entidade" AS ENUM('prontuario', 'receita', 'atestado', 'paciente');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"acao" "audit_acao" NOT NULL,
	"entidade" "audit_entidade" NOT NULL,
	"entidade_id" text NOT NULL,
	"paciente_id" text,
	"detalhe" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "anonimizado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "anonimizado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_paciente_id_idx" ON "audit_logs" USING btree ("paciente_id");