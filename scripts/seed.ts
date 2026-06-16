/**
 * Seed script para ClinicFlow
 * Execução: npx tsx scripts/seed.ts
 * (ou: bun scripts/seed.ts)
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import * as schema from "../src/db/schema";
import { Argon2id } from "oslo/password";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Aceita tenant_id via variável de ambiente para popular conta real
// Ex: SEED_TENANT_ID=xxxx npx tsx scripts/seed.ts
const TENANT_ID = process.env.SEED_TENANT_ID ?? "seed-clinicflow-tenant-001";

// IDs baseados no tenant para permitir seed em múltiplos tenants
const T = TENANT_ID.slice(0, 8);
const PROF_CARLOS = `${T}-prof-carlos`;
const PROF_ANA    = `${T}-prof-ana`;
const PROF_PAULO  = `${T}-prof-paulo`;

const SVC_CONSULTA_MEDICA = `${T}-svc-consulta-med`;
const SVC_RETORNO         = `${T}-svc-retorno`;
const SVC_CONSULTA_DENTAL = `${T}-svc-consulta-dnt`;
const SVC_SESSAO_PSICO    = `${T}-svc-sessao-psico`;
const SVC_EXAME_SANGUE    = `${T}-svc-exame-sangue`;

const pacienteIds = Array.from({ length: 10 }, (_, i) => `${T}-pac-${String(i + 1).padStart(3, "0")}`);

const hoje = new Date();
function diasRelativo(delta: number) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Iniciando seed...");

  // 1. Tenant
  await db.insert(schema.tenants).values({
    id: TENANT_ID,
    nome: "Clínica São Lucas",
    tipo: "clinica_medica",
    slug: "clinica-sao-lucas-seed",
    email: "contato@clinicasaolucas.com.br",
    telefone: "11912345678",
    cidade: "São Paulo",
    estado: "SP",
    cnpj: "00.000.000/0001-00",
    cnes: "1234567",
    planoSaas: "pro",
    status: "ativo",
  }).onConflictDoNothing();

  // 2. Profissionais
  await db.insert(schema.professionals).values([
    {
      id: PROF_CARLOS,
      tenantId: TENANT_ID,
      nome: "Dr. Carlos Silva",
      especialidade: "medico",
      registro: "12345",
      conselho: "CRM",
      uf: "SP",
      telefone: "11911111111",
      email: "carlos@clinicasaolucas.com.br",
      cor: "#3b82f6",
      comissao: "30",
    },
    {
      id: PROF_ANA,
      tenantId: TENANT_ID,
      nome: "Dra. Ana Costa",
      especialidade: "dentista",
      registro: "6789",
      conselho: "CRO",
      uf: "SP",
      telefone: "11922222222",
      email: "ana@clinicasaolucas.com.br",
      cor: "#10b981",
      comissao: "35",
    },
    {
      id: PROF_PAULO,
      tenantId: TENANT_ID,
      nome: "Dr. Paulo Mendes",
      especialidade: "psicologo",
      registro: "54321",
      conselho: "CRP",
      uf: "SP",
      telefone: "11933333333",
      email: "paulo@clinicasaolucas.com.br",
      cor: "#8b5cf6",
      comissao: "40",
    },
  ]).onConflictDoNothing();

  // 3. Serviços
  await db.insert(schema.services).values([
    {
      id: SVC_CONSULTA_MEDICA,
      tenantId: TENANT_ID,
      nome: "Consulta Médica",
      categoria: "consulta",
      preco: "250.00",
      duracao: 30,
      descricao: "Consulta clínica geral",
    },
    {
      id: SVC_RETORNO,
      tenantId: TENANT_ID,
      nome: "Retorno",
      categoria: "retorno",
      preco: "150.00",
      duracao: 20,
      descricao: "Consulta de retorno",
    },
    {
      id: SVC_CONSULTA_DENTAL,
      tenantId: TENANT_ID,
      nome: "Consulta Odontológica",
      categoria: "consulta",
      preco: "200.00",
      duracao: 45,
      descricao: "Avaliação odontológica",
    },
    {
      id: SVC_SESSAO_PSICO,
      tenantId: TENANT_ID,
      nome: "Sessão de Psicologia",
      categoria: "terapia",
      preco: "180.00",
      duracao: 50,
      descricao: "Psicoterapia individual",
    },
    {
      id: SVC_EXAME_SANGUE,
      tenantId: TENANT_ID,
      nome: "Exame de Sangue",
      categoria: "exame",
      preco: "120.00",
      duracao: 15,
      descricao: "Coleta e análise de sangue",
    },
  ]).onConflictDoNothing();

  // 4. Pacientes (10)
  const pacientes = [
    { nome: "João Pereira",        cpf: "123.456.789-01", dataNascimento: "1985-03-15", sexo: "masculino" as const, telefone: "11991111111", convenio: "Unimed", tipoSanguineo: "A+" },
    { nome: "Maria Santos",         cpf: "234.567.890-12", dataNascimento: "1992-07-22", sexo: "feminino"  as const, telefone: "11992222222", tipoSanguineo: "O-" },
    { nome: "Carlos Oliveira",      cpf: "345.678.901-23", dataNascimento: "1978-11-30", sexo: "masculino" as const, telefone: "11993333333", convenio: "Bradesco Saúde", tipoSanguineo: "B+" },
    { nome: "Ana Lima",             cpf: "456.789.012-34", dataNascimento: "2001-05-08", sexo: "feminino"  as const, telefone: "11994444444", alergias: "Dipirona" },
    { nome: "Pedro Alves",          cpf: "567.890.123-45", dataNascimento: "1967-09-14", sexo: "masculino" as const, telefone: "11995555555", tipoSanguineo: "AB+" },
    { nome: "Lucia Ferreira",       cpf: "678.901.234-56", dataNascimento: "1995-01-28", sexo: "feminino"  as const, telefone: "11996666666", convenio: "Sul América" },
    { nome: "Rafael Costa",         cpf: "789.012.345-67", dataNascimento: "1988-06-03", sexo: "masculino" as const, telefone: "11997777777", tipoSanguineo: "O+" },
    { nome: "Fernanda Rocha",       cpf: "890.123.456-78", dataNascimento: "2003-12-19", sexo: "feminino"  as const, telefone: "11998888888" },
    { nome: "Marcos Souza",         cpf: "901.234.567-89", dataNascimento: "1972-04-25", sexo: "masculino" as const, telefone: "11999999999", alergias: "Penicilina" },
    { nome: "Isabela Martins",      cpf: "012.345.678-90", dataNascimento: "1999-08-11", sexo: "feminino"  as const, telefone: "11900000000", convenio: "Amil" },
  ];

  await db.insert(schema.patients).values(
    pacientes.map((p, i) => ({ id: pacienteIds[i], tenantId: TENANT_ID, ...p }))
  ).onConflictDoNothing();

  // 5. Agendamentos (20) — distribuídos nos últimos 30 dias e próximos 7 dias
  const agendamentoData = [
    // Passados — concluídos (15)
    { dia: -20, hora: "08:00", fim: "08:30", pac: 0, prof: PROF_CARLOS, svc: SVC_CONSULTA_MEDICA, status: "concluido" as const, tipo: "particular" as const, preco: "250.00" },
    { dia: -19, hora: "09:00", fim: "09:50", pac: 1, prof: PROF_PAULO,  svc: SVC_SESSAO_PSICO,    status: "concluido" as const, tipo: "particular" as const, preco: "180.00" },
    { dia: -18, hora: "10:00", fim: "10:45", pac: 2, prof: PROF_ANA,    svc: SVC_CONSULTA_DENTAL, status: "concluido" as const, tipo: "convenio"  as const, preco: "200.00", convenio: "Bradesco Saúde" },
    { dia: -17, hora: "14:00", fim: "14:30", pac: 3, prof: PROF_CARLOS, svc: SVC_CONSULTA_MEDICA, status: "concluido" as const, tipo: "particular" as const, preco: "250.00" },
    { dia: -15, hora: "08:30", fim: "09:00", pac: 4, prof: PROF_CARLOS, svc: SVC_RETORNO,          status: "concluido" as const, tipo: "particular" as const, preco: "150.00" },
    { dia: -14, hora: "09:00", fim: "09:50", pac: 5, prof: PROF_PAULO,  svc: SVC_SESSAO_PSICO,    status: "concluido" as const, tipo: "convenio"  as const, preco: "180.00", convenio: "Sul América" },
    { dia: -12, hora: "11:00", fim: "11:45", pac: 6, prof: PROF_ANA,    svc: SVC_CONSULTA_DENTAL, status: "concluido" as const, tipo: "particular" as const, preco: "200.00" },
    { dia: -10, hora: "15:00", fim: "15:30", pac: 7, prof: PROF_CARLOS, svc: SVC_EXAME_SANGUE,    status: "concluido" as const, tipo: "particular" as const, preco: "120.00" },
    { dia:  -9, hora: "08:00", fim: "08:50", pac: 8, prof: PROF_PAULO,  svc: SVC_SESSAO_PSICO,    status: "concluido" as const, tipo: "particular" as const, preco: "180.00" },
    { dia:  -7, hora: "10:00", fim: "10:30", pac: 9, prof: PROF_CARLOS, svc: SVC_CONSULTA_MEDICA, status: "concluido" as const, tipo: "convenio"  as const, preco: "250.00", convenio: "Amil" },
    { dia:  -5, hora: "09:00", fim: "09:30", pac: 0, prof: PROF_CARLOS, svc: SVC_RETORNO,          status: "concluido" as const, tipo: "particular" as const, preco: "150.00" },
    { dia:  -4, hora: "14:00", fim: "14:45", pac: 1, prof: PROF_ANA,    svc: SVC_CONSULTA_DENTAL, status: "concluido" as const, tipo: "particular" as const, preco: "200.00" },
    { dia:  -3, hora: "16:00", fim: "16:50", pac: 2, prof: PROF_PAULO,  svc: SVC_SESSAO_PSICO,    status: "faltou"    as const, tipo: "particular" as const, preco: "180.00" },
    { dia:  -2, hora: "08:00", fim: "08:30", pac: 3, prof: PROF_CARLOS, svc: SVC_CONSULTA_MEDICA, status: "concluido" as const, tipo: "particular" as const, preco: "250.00" },
    { dia:  -1, hora: "10:00", fim: "10:15", pac: 4, prof: PROF_CARLOS, svc: SVC_EXAME_SANGUE,    status: "concluido" as const, tipo: "convenio"  as const, preco: "120.00", convenio: "Unimed" },
    // Futuros — agendados/confirmados (5)
    { dia:   1, hora: "09:00", fim: "09:30", pac: 5, prof: PROF_CARLOS, svc: SVC_CONSULTA_MEDICA, status: "agendado"  as const, tipo: "particular" as const, preco: "250.00" },
    { dia:   1, hora: "14:00", fim: "14:50", pac: 6, prof: PROF_PAULO,  svc: SVC_SESSAO_PSICO,    status: "confirmado" as const, tipo: "particular" as const, preco: "180.00" },
    { dia:   2, hora: "10:00", fim: "10:45", pac: 7, prof: PROF_ANA,    svc: SVC_CONSULTA_DENTAL, status: "agendado"  as const, tipo: "convenio"  as const, preco: "200.00", convenio: "Unimed" },
    { dia:   3, hora: "08:30", fim: "09:00", pac: 8, prof: PROF_CARLOS, svc: SVC_RETORNO,          status: "agendado"  as const, tipo: "particular" as const, preco: "150.00" },
    { dia:   5, hora: "16:00", fim: "16:50", pac: 9, prof: PROF_PAULO,  svc: SVC_SESSAO_PSICO,    status: "agendado"  as const, tipo: "particular" as const, preco: "180.00" },
  ];

  const apptIds = agendamentoData.map((_, i) => `${T}-appt-${String(i + 1).padStart(3, "0")}`);

  await db.insert(schema.appointments).values(
    agendamentoData.map((a, i) => ({
      id: apptIds[i],
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[a.pac],
      professionalId: a.prof,
      serviceId: a.svc,
      data: diasRelativo(a.dia),
      horaInicio: a.hora,
      horaFim: a.fim,
      status: a.status,
      tipoAtendimento: a.tipo,
      preco: a.preco,
      convenio: (a as any).convenio ?? null,
    }))
  ).onConflictDoNothing();

  // 6. Prontuários (5)
  const recordIds = Array.from({ length: 5 }, (_, i) => `${T}-rec-${String(i + 1).padStart(3, "0")}`);

  await db.insert(schema.records).values([
    {
      id: recordIds[0],
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[0],
      professionalId: PROF_CARLOS,
      appointmentId: apptIds[0],
      data: diasRelativo(-20),
      queixaPrincipal: "Dor de cabeça frequente e tontura",
      historicoClinico: "Paciente refere cefaleia há 2 semanas, sem febre",
      exameClinico: "PA: 130/85 mmHg. FC: 78bpm. Sem alterações neurológicas",
      diagnostico: "Cefaleia tensional",
      cid: "G44",
      conduta: "Analgésico simples + repouso. Retorno em 15 dias",
      retorno: diasRelativo(5),
    },
    {
      id: recordIds[1],
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[1],
      professionalId: PROF_PAULO,
      appointmentId: apptIds[1],
      data: diasRelativo(-19),
      queixaPrincipal: "Ansiedade e dificuldade de sono",
      historicoClinico: "Paciente relata ansiedade há 6 meses, dificuldade de concentração",
      exameClinico: "Estado geral preservado. Humor levemente deprimido",
      diagnostico: "Transtorno de ansiedade generalizada",
      cid: "F41.1",
      conduta: "Início de psicoterapia cognitivo-comportamental. Sessões semanais",
    },
    {
      id: recordIds[2],
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[2],
      professionalId: PROF_ANA,
      appointmentId: apptIds[2],
      data: diasRelativo(-18),
      queixaPrincipal: "Dor de dente e sensibilidade",
      exameClinico: "Cárie em dente 46. Sensibilidade à percussão",
      diagnostico: "Cárie dentária — dente 46",
      cid: "K02",
      conduta: "Restauração com resina composta agendada",
    },
    {
      id: recordIds[3],
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[3],
      professionalId: PROF_CARLOS,
      appointmentId: apptIds[3],
      data: diasRelativo(-17),
      queixaPrincipal: "Febre e dor de garganta há 3 dias",
      exameClinico: "T: 38.2°C. Orofaringe hiperemiada. Amígdalas aumentadas com exsudato",
      diagnostico: "Amigdalite bacteriana",
      cid: "J03",
      conduta: "Antibioticoterapia por 7 dias. Antitérmico se necessário",
      retorno: diasRelativo(-10),
    },
    {
      id: recordIds[4],
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[5],
      professionalId: PROF_PAULO,
      appointmentId: apptIds[5],
      data: diasRelativo(-14),
      queixaPrincipal: "Estresse no trabalho e conflitos familiares",
      historicoClinico: "Relatou episódios de choro frequente e irritabilidade",
      exameClinico: "Afeto ansioso. Discurso coerente",
      diagnostico: "Episódio depressivo leve",
      cid: "F32.0",
      conduta: "Psicoterapia semanal. Avaliação psiquiátrica se necessário",
    },
  ]).onConflictDoNothing();

  // 7. Receitas (3)
  await db.insert(schema.prescriptions).values([
    {
      id: `${T}-presc-001`,
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[0],
      professionalId: PROF_CARLOS,
      recordId: recordIds[0],
      data: diasRelativo(-20),
      medicamentos: JSON.stringify([
        { nome: "Paracetamol 500mg", via: "Oral", posologia: "1 comprimido a cada 6h", duracao: "5 dias", quantidade: "20" },
        { nome: "Dipirona Sódica 500mg", via: "Oral", posologia: "1 comprimido se dor intensa", duracao: "SOS", quantidade: "10" },
      ]),
      observacoes: "Evitar álcool durante o tratamento",
    },
    {
      id: `${T}-presc-002`,
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[3],
      professionalId: PROF_CARLOS,
      recordId: recordIds[3],
      data: diasRelativo(-17),
      medicamentos: JSON.stringify([
        { nome: "Amoxicilina 500mg", via: "Oral", posologia: "1 cápsula a cada 8h", duracao: "7 dias", quantidade: "21" },
        { nome: "Ibuprofeno 400mg", via: "Oral", posologia: "1 comprimido a cada 8h", duracao: "3 dias", quantidade: "9" },
      ]),
    },
    {
      id: `${T}-presc-003`,
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[4],
      professionalId: PROF_CARLOS,
      recordId: null,
      data: diasRelativo(-5),
      medicamentos: JSON.stringify([
        { nome: "Losartana 50mg", via: "Oral", posologia: "1 comprimido pela manhã", duracao: "Uso contínuo", quantidade: "30" },
        { nome: "Atorvastatina 20mg", via: "Oral", posologia: "1 comprimido à noite", duracao: "Uso contínuo", quantidade: "30" },
      ]),
      observacoes: "Monitorar pressão arterial semanalmente",
    },
  ]).onConflictDoNothing();

  // 8. Atestados (2)
  await db.insert(schema.certificates).values([
    {
      id: `${T}-cert-001`,
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[1],
      professionalId: PROF_PAULO,
      recordId: recordIds[1],
      tipo: "afastamento",
      diasAfastamento: 2,
      dataInicio: diasRelativo(-19),
      dataFim: diasRelativo(-18),
      cid: "F41.1",
      motivo: "Transtorno de ansiedade generalizada",
      cidade: "São Paulo",
    },
    {
      id: `${T}-cert-002`,
      tenantId: TENANT_ID,
      pacienteId: pacienteIds[3],
      professionalId: PROF_CARLOS,
      recordId: recordIds[3],
      tipo: "afastamento",
      diasAfastamento: 3,
      dataInicio: diasRelativo(-17),
      dataFim: diasRelativo(-15),
      cid: "J03",
      motivo: "Amigdalite bacteriana aguda",
      cidade: "São Paulo",
    },
  ]).onConflictDoNothing();

  // 9. Transações financeiras (15)
  const receitas = [
    { desc: "Consulta João Pereira",    cat: "Consultas",    valor: "250.00", dia: -20 },
    { desc: "Sessão Ana Costa (psico)", cat: "Procedimentos", valor: "180.00", dia: -19 },
    { desc: "Avaliação odontológica",   cat: "Consultas",    valor: "200.00", dia: -18 },
    { desc: "Consulta Ana Lima",        cat: "Consultas",    valor: "250.00", dia: -17 },
    { desc: "Retorno Pedro Alves",      cat: "Consultas",    valor: "150.00", dia: -15 },
    { desc: "Sessão Lúcia Ferreira",    cat: "Procedimentos", valor: "180.00", dia: -14 },
    { desc: "Consulta Rafael Costa",    cat: "Consultas",    valor: "200.00", dia: -12 },
    { desc: "Exame de sangue",          cat: "Exames",       valor: "120.00", dia: -10 },
    { desc: "Sessão Marcos Souza",      cat: "Procedimentos", valor: "180.00", dia:  -9 },
    { desc: "Consulta Isabela",         cat: "Consultas",    valor: "250.00", dia:  -7 },
  ];

  const despesas = [
    { desc: "Aluguel do mês",             cat: "Aluguel",      valor: "3500.00", dia: -15 },
    { desc: "Material de escritório",     cat: "Materiais",    valor: "280.00",  dia: -12 },
    { desc: "Conta de energia",           cat: "Outros",       valor: "420.00",  dia: -10 },
    { desc: "Equipamento de diagnóstico", cat: "Equipamentos", valor: "1200.00", dia:  -8 },
    { desc: "Marketing digital",          cat: "Marketing",    valor: "500.00",  dia:  -5 },
  ];

  await db.insert(schema.transacoes).values([
    ...receitas.map((r, i) => ({
      id: `${T}-txn-rec-${String(i + 1).padStart(3, "0")}`,
      tenantId: TENANT_ID,
      tipo: "receita",
      categoria: r.cat,
      descricao: r.desc,
      valor: r.valor,
      data: diasRelativo(r.dia),
      pago: true,
      status: "pago",
    })),
    ...despesas.map((d, i) => ({
      id: `${T}-txn-des-${String(i + 1).padStart(3, "0")}`,
      tenantId: TENANT_ID,
      tipo: "despesa",
      categoria: d.cat,
      descricao: d.desc,
      valor: d.valor,
      data: diasRelativo(d.dia),
      pago: true,
      status: "pago",
    })),
  ]).onConflictDoNothing();

  console.log("Seed concluído com sucesso!");
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log("Criados:");
  console.log("  - 1 clínica (Clínica São Lucas)");
  console.log("  - 3 profissionais");
  console.log("  - 5 serviços");
  console.log("  - 10 pacientes");
  console.log("  - 20 agendamentos");
  console.log("  - 5 prontuários");
  console.log("  - 3 receitas médicas");
  console.log("  - 2 atestados");
  console.log("  - 15 transações financeiras (10 receitas + 5 despesas)");
}

main().catch(console.error);
