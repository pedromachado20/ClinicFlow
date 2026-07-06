CREATE TYPE "public"."clinic_type" AS ENUM('clinica_medica', 'consultorio_dentario', 'consultorio_psicologia', 'clinica_fisioterapia', 'outro');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan_clinic" AS ENUM('trial', 'basico', 'pro', 'premium');--> statement-breakpoint
CREATE TYPE "public"."tenant_status_clinic" AS ENUM('ativo', 'inativo', 'trial', 'suspenso');--> statement-breakpoint
CREATE TYPE "public"."user_role_clinic" AS ENUM('owner', 'admin', 'medico', 'recepcionista');--> statement-breakpoint
CREATE TYPE "public"."especialidade_enum" AS ENUM('medico', 'dentista', 'psicologo', 'fisioterapeuta', 'nutricionista', 'enfermeiro', 'outro');--> statement-breakpoint
CREATE TYPE "public"."sexo_enum" AS ENUM('masculino', 'feminino', 'outro');--> statement-breakpoint
CREATE TYPE "public"."servico_categoria" AS ENUM('consulta', 'retorno', 'exame', 'procedimento', 'cirurgia', 'terapia', 'outro');--> statement-breakpoint
CREATE TYPE "public"."appt_status" AS ENUM('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'faltou', 'remarcado');--> statement-breakpoint
CREATE TYPE "public"."tipo_atendimento" AS ENUM('particular', 'convenio');--> statement-breakpoint
CREATE TYPE "public"."cert_tipo" AS ENUM('afastamento', 'comparecimento', 'escolar');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"tipo" "clinic_type" DEFAULT 'clinica_medica' NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text,
	"cidade" text,
	"estado" text,
	"cnpj" text,
	"cnes" text,
	"plano_saas" "tenant_plan_clinic" DEFAULT 'trial' NOT NULL,
	"status" "tenant_status_clinic" DEFAULT 'trial' NOT NULL,
	"whatsapp_ativo" boolean DEFAULT false NOT NULL,
	"whatsapp_provider" text DEFAULT 'nenhum',
	"evolution_api_url" text,
	"evolution_api_key" text,
	"evolution_instance" text,
	"zapi_client_token" text,
	"notif_agendamento" boolean DEFAULT false NOT NULL,
	"notif_lembrete" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role_clinic" DEFAULT 'owner',
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professionals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"nome" text NOT NULL,
	"especialidade" "especialidade_enum" DEFAULT 'medico' NOT NULL,
	"registro" text,
	"conselho" text,
	"uf" text,
	"telefone" text,
	"email" text,
	"cor" text DEFAULT '#0ea5e9' NOT NULL,
	"comissao" text,
	"foto_url" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"nome" text NOT NULL,
	"cpf" text,
	"rg" text,
	"data_nascimento" text,
	"sexo" "sexo_enum",
	"telefone" text,
	"email" text,
	"convenio" text,
	"numero_convenio" text,
	"tipo_sanguineo" text,
	"alergias" text,
	"observacoes" text,
	"foto_url" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"nome" text NOT NULL,
	"categoria" "servico_categoria" DEFAULT 'consulta' NOT NULL,
	"preco" text DEFAULT '0' NOT NULL,
	"duracao" integer DEFAULT 30 NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"professional_id" text NOT NULL,
	"service_id" text NOT NULL,
	"data" text NOT NULL,
	"hora_inicio" text NOT NULL,
	"hora_fim" text NOT NULL,
	"status" "appt_status" DEFAULT 'agendado' NOT NULL,
	"tipo_atendimento" "tipo_atendimento" DEFAULT 'particular' NOT NULL,
	"convenio" text,
	"preco" text DEFAULT '0' NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"professional_id" text NOT NULL,
	"appointment_id" text,
	"data" text NOT NULL,
	"queixa_principal" text,
	"historico_clinico" text,
	"exame_clinico" text,
	"diagnostico" text,
	"cid" text,
	"conduta" text,
	"retorno" text,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"professional_id" text NOT NULL,
	"record_id" text,
	"data" text NOT NULL,
	"medicamentos" text DEFAULT '[]' NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"professional_id" text NOT NULL,
	"record_id" text,
	"tipo" "cert_tipo" DEFAULT 'afastamento' NOT NULL,
	"dias_afastamento" integer DEFAULT 1 NOT NULL,
	"data_inicio" text NOT NULL,
	"data_fim" text NOT NULL,
	"cid" text,
	"motivo" text,
	"cidade" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"tipo" text NOT NULL,
	"categoria" text NOT NULL,
	"descricao" text NOT NULL,
	"valor" text NOT NULL,
	"data" text NOT NULL,
	"pago" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pago' NOT NULL,
	"referencia" text,
	"paciente_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_paciente_id_patients_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_paciente_id_patients_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_paciente_id_patients_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_paciente_id_patients_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;