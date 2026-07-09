import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import {
  Stethoscope, CalendarDays, Users, ClipboardList, Receipt, DollarSign,
  BarChart3, MessageCircle, ShieldCheck, UserCheck, CheckCircle2,
  ArrowRight, X, Check,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/utils";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getWebRequest }, { auth }] = await Promise.all([
    import("@tanstack/start/server"),
    import("~/lib/auth"),
  ]);
  const req = getWebRequest();
  if (!req) return false;
  const session = await auth.api.getSession({ headers: req.headers });
  return !!session;
});

const getPricing = createServerFn({ method: "GET" }).handler(async () => {
  const { SUBSCRIPTION_PRICE, TRIAL_DAYS } = await import("~/lib/billing");
  return { preco: SUBSCRIPTION_PRICE, trialDias: TRIAL_DAYS };
});

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const isAuth = await checkAuth();
    if (isAuth) throw redirect({ to: "/dashboard" });
  },
  loader: async () => await getPricing(),
  head: () => ({
    meta: [
      { title: "ClinicFlow — Sistema de Gestão para Clínicas e Consultórios" },
      {
        name: "description",
        content: "Agenda, prontuário, receitas, caixa, financeiro e lembrete automático por WhatsApp em um só sistema. 7 dias grátis, sem cartão de crédito.",
      },
      { property: "og:title", content: "ClinicFlow — Sistema de Gestão para Clínicas e Consultórios" },
      {
        property: "og:description",
        content: "Sua clínica, sem papel e sem falta. Agenda, prontuário, caixa, financeiro e WhatsApp automático em um só lugar.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const funcionalidades = [
  { icon: CalendarDays, titulo: "Agenda inteligente", desc: "Marca consulta e bloqueia choque de horário do mesmo profissional automaticamente." },
  { icon: Users, titulo: "Cadastro de pacientes", desc: "CPF, convênio, alergias, tipo sanguíneo e foto — tudo em um lugar, ligado ao histórico." },
  { icon: ClipboardList, titulo: "Prontuário, receita e atestado", desc: "Prontuário com CID-10, receita com múltiplos medicamentos e atestado prontos para imprimir." },
  { icon: Receipt, titulo: "Caixa do dia", desc: "Fecha o atendimento por paciente, aplica desconto e emite cupom ou recibo em PDF." },
  { icon: DollarSign, titulo: "Financeiro", desc: "Receitas e despesas por categoria, saldo do dia e do mês em tempo real." },
  { icon: BarChart3, titulo: "Relatórios", desc: "Top serviços, particular x convênio e taxa de comparecimento, exportáveis em PDF." },
  { icon: MessageCircle, titulo: "WhatsApp automático", desc: "Confirmação de agendamento e lembrete de consulta enviados sozinhos pro paciente." },
  { icon: UserCheck, titulo: "Equipe com permissão", desc: "Dono, profissional e recepção — cada um vê só o que precisa ver." },
  { icon: ShieldCheck, titulo: "LGPD embutida", desc: "Auditoria de acesso a prontuário, exportação e anonimização de dados do paciente." },
];

const beneficios = [
  "Nunca mais choque de horário na agenda",
  "Prontuário, receita e atestado prontos em segundos",
  "Caixa do dia fechado por paciente, com cupom ou recibo",
  "Saiba na hora se o mês fechou no azul",
  "Paciente lembrado automaticamente pelo WhatsApp",
  "Equipe com acesso controlado por papel",
  "Auditoria e anonimização prontas para a LGPD",
  "Um preço só, tudo incluso, sem pegadinha",
];

const publico = [
  "Clínica médica", "Consultório odontológico", "Psicologia", "Fisioterapia", "Nutrição", "Consultório autônomo",
];

const faqs = [
  { p: "Preciso de cartão de crédito para testar?", r: "Não. Você usa o ClinicFlow por 7 dias grátis, sem informar cartão. Só assina se quiser continuar." },
  { p: "Tem fidelidade ou multa de cancelamento?", r: "Não. Sem fidelidade — seus dados continuam guardados mesmo se a assinatura ficar em atraso, e você pode assinar quando quiser." },
  { p: "Funciona para atendimento por convênio?", r: "Sim. A agenda, o caixa e os relatórios separam particular e convênio automaticamente, já que o repasse de convênio costuma ser posterior." },
  { p: "O lembrete por WhatsApp tem custo extra?", r: "Não. Você conecta sua própria instância WhatsApp (Z-API ou Evolution API) direto nas configurações e o envio já está incluso no plano." },
  { p: "Meus dados e os dos meus pacientes estão seguros?", r: "Sim. Segredos de integração ficam criptografados, cada clínica só acessa seus próprios dados, e há auditoria e ferramentas de exportação/anonimização para conformidade com a LGPD." },
  { p: "Dá para ter mais de um profissional na mesma clínica?", r: "Sim. Você cadastra quantos profissionais e membros de equipe precisar, cada um com o papel de acesso adequado (dono, profissional ou recepção)." },
];

function LandingPage() {
  const { preco, trialDias } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">ClinicFlow</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preço</a>
            <a href="#faq" className="hover:text-foreground transition-colors">Perguntas frequentes</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm">Criar conta grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> {trialDias} dias grátis, sem cartão de crédito
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Sua clínica, sem papel e sem falta.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Agenda, prontuário, receitas, caixa e financeiro em um só sistema — com lembrete
              automático de consulta pelo WhatsApp para o paciente não faltar.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  Criar conta grátis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#funcionalidades" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Ver funcionalidades</Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Já é cliente? <Link to="/login" className="text-primary hover:underline">Entrar na sua conta</Link>
            </p>
          </div>

          {/* Preview do produto (mock estilizado, mesmos tokens visuais do app) */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Bem-vindo ao ClinicFlow</p>
              <span className="text-[10px] text-muted-foreground">Resumo da sua clínica</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Consultas Hoje", value: "12", icon: CalendarDays, color: "text-primary" },
                { label: "Pacientes Ativos", value: "348", icon: Users, color: "text-success" },
                { label: "Receita do Mês", value: formatCurrency(18400), icon: DollarSign, color: "text-success" },
                { label: "Comparecimento", value: "91%", icon: BarChart3, color: "text-warning" },
              ].map((k) => (
                <div key={k.label} className="rounded-lg border border-border bg-background/60 p-3">
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                  <p className="mt-2 text-lg font-bold">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Próximas consultas</p>
              {[
                { nome: "Maria Souza", info: "Consulta · Dra. Ana · 14:30", tag: "Particular" },
                { nome: "João Pereira", info: "Retorno · Dr. Lima · 15:00", tag: "Convênio" },
              ].map((c) => (
                <div key={c.nome} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-xs">
                  <div>
                    <p className="font-medium">{c.nome}</p>
                    <p className="text-muted-foreground">{c.info}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{c.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dor / Agitação */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Reconhece essa rotina?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              "Paciente falta sem avisar e você só descobre quando ele não chega.",
              "Ninguém sabe ao certo se o mês fechou no azul ou no vermelho.",
              "Prontuário é uma pasta física — ou pior, um caderno perdido em algum lugar.",
            ].map((dor) => (
              <div key={dor} className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                <X className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-muted-foreground">{dor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">O ClinicFlow resolve tudo isso</h2>
          <p className="mt-3 text-muted-foreground">
            Um sistema único no lugar do papel, da planilha e do WhatsApp pessoal da recepção.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map((b) => (
            <div key={b} className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-4">
              <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
              <p className="text-sm">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Tudo que sua clínica precisa</h2>
            <p className="mt-3 text-muted-foreground">Cada módulo pensado para o dia a dia de quem atende paciente.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {funcionalidades.map((f) => (
              <div key={f.titulo} className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-semibold">{f.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Para quem é o ClinicFlow</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {publico.map((p) => (
            <span key={p} className="rounded-full border border-border bg-card px-4 py-2 text-sm">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Preço */}
      <section id="precos" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Um preço só, tudo incluso</h2>
          <p className="mt-3 text-center text-muted-foreground">Sem plano capado, sem taxa por profissional, sem letra miúda.</p>
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-primary/30 bg-card p-8 text-center shadow-xl shadow-black/30">
            <p className="text-sm font-medium text-primary">Plano ClinicFlow</p>
            <p className="mt-3 text-4xl font-black">
              {formatCurrency(preco)}<span className="text-base font-medium text-muted-foreground">/mês</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{trialDias} dias grátis para testar, sem cartão de crédito</p>
            <ul className="mt-6 space-y-2.5 text-left text-sm">
              {[
                "Agenda, Pacientes e Prontuários",
                "Caixa, Financeiro e Relatórios",
                "Lembretes automáticos por WhatsApp",
                "Equipe com permissões por papel",
                "Auditoria e ferramentas de LGPD",
                "Sem fidelidade — cancele quando quiser",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
            <Link to="/onboarding" className="mt-7 block">
              <Button size="lg" className="w-full">
                Criar conta grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.p} className="group rounded-xl border border-border bg-card p-4 open:pb-4">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {f.p}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Pronto para organizar sua clínica?</h2>
          <p className="mt-3 text-muted-foreground">
            Crie sua conta agora e use o ClinicFlow por {trialDias} dias sem custo, sem cartão de crédito.
          </p>
          <Link to="/onboarding" className="mt-6 inline-block">
            <Button size="lg">Criar conta grátis <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">ClinicFlow</span>
          </div>
          <p>© {new Date().getFullYear()} ClinicFlow. Todos os direitos reservados.</p>
          <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
        </div>
        <div className="border-t border-border px-4 py-6 text-center sm:px-6">
          <p className="mb-2 text-xs text-muted-foreground">um produto</p>
          <a
            href="https://nexusteck.com.br"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl bg-neutral-950 px-6 py-3 shadow-md transition-opacity hover:opacity-90"
          >
            <img src="/logo-nexusteck.png" alt="NexusTeck" className="h-14 w-auto" />
          </a>
        </div>
      </footer>
    </div>
  );
}
