import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useState } from "react";
import { Stethoscope, ArrowRight, ArrowLeft, Check, Building2, Heart, Brain, Activity } from "lucide-react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

const criarClinica = createServerFn({ method: "POST" })
  .validator(z.object({
    nomeClinica: z.string().min(2),
    tipoClinica: z.string(),
    email: z.string().email(),
    telefone: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cnpj: z.string().optional(),
    cnes: z.string().optional(),
    nomeProfissional: z.string().min(2),
    especialidade: z.string(),
    registro: z.string().optional(),
    conselho: z.string().optional(),
    uf: z.string().optional(),
    senha: z.string().min(6),
  }))
  .handler(async ({ data }) => {
    const { db } = await import("~/db");
    const { auth } = await import("~/lib/auth");
    const { tenants, users, professionals } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { slugify } = await import("~/lib/utils");

    const slug = slugify(data.nomeClinica) + "-" + Math.random().toString(36).slice(2, 6);
    const tenantId = crypto.randomUUID();

    await db.insert(tenants).values({
      id: tenantId,
      nome: data.nomeClinica,
      tipo: data.tipoClinica as any,
      slug,
      email: data.email,
      telefone: data.telefone,
      cidade: data.cidade,
      estado: data.estado,
      cnpj: data.cnpj,
      cnes: data.cnes,
    });

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: data.nomeProfissional,
        email: data.email,
        password: data.senha,
      },
    });

    if (signUpResult.user) {
      await db.update(users)
        .set({ tenantId, role: "owner" })
        .where(eq(users.id, signUpResult.user.id));
    }

    await db.insert(professionals).values({
      id: crypto.randomUUID(),
      tenantId,
      nome: data.nomeProfissional,
      especialidade: data.especialidade as any,
      registro: data.registro,
      conselho: data.conselho,
      uf: data.uf,
    });

    return { ok: true };
  });

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingPage,
});

const tiposClinica = [
  { value: "clinica_medica", label: "Clínica Médica", icon: Building2 },
  { value: "consultorio_dentario", label: "Consultório Dentário", icon: Heart },
  { value: "consultorio_psicologia", label: "Psicologia / Terapia", icon: Brain },
  { value: "clinica_fisioterapia", label: "Fisioterapia", icon: Activity },
  { value: "outro", label: "Outro", icon: Stethoscope },
];

const especialidades = [
  { value: "medico", label: "Médico" },
  { value: "dentista", label: "Dentista" },
  { value: "psicologo", label: "Psicólogo" },
  { value: "fisioterapeuta", label: "Fisioterapeuta" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "enfermeiro", label: "Enfermeiro" },
  { value: "outro", label: "Outro" },
];

const conselhos = ["CRM", "CRO", "CRP", "CREFITO", "CRN", "COREN"];

const steps = ["Tipo", "Clínica", "Profissional", "Acesso"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [espSel, setEspSel] = useState("");
  const [conselhoSel, setConselhoSel] = useState("");
  const [form, setForm] = useState({
    tipoClinica: "",
    nomeClinica: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    cnpj: "",
    cnes: "",
    nomeProfissional: "",
    registro: "",
    uf: "",
    senha: "",
    confirmarSenha: "",
  });

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFinish() {
    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await criarClinica({
        data: {
          nomeClinica: form.nomeClinica,
          tipoClinica: form.tipoClinica || "clinica_medica",
          email: form.email,
          telefone: form.telefone || undefined,
          cidade: form.cidade || undefined,
          estado: form.estado || undefined,
          cnpj: form.cnpj || undefined,
          cnes: form.cnes || undefined,
          nomeProfissional: form.nomeProfissional,
          especialidade: espSel || "medico",
          registro: form.registro || undefined,
          conselho: conselhoSel || undefined,
          uf: form.uf || undefined,
          senha: form.senha,
        },
      });
      const { signIn } = await import("~/lib/auth-client");
      await signIn.email({ email: form.email, password: form.senha });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar clínica");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-lg space-y-6 p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Criar conta no ClinicFlow</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 text-primary border border-primary" :
                "bg-secondary text-muted-foreground"
              )}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:inline", i === step ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
              {i < steps.length - 1 && <div className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 0 - Tipo de clínica */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Selecione o tipo de estabelecimento</p>
            <div className="grid grid-cols-1 gap-2">
              {tiposClinica.map((t) => (
                <button
                  key={t.value}
                  onClick={() => updateForm("tipoClinica", t.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    form.tipoClinica === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-accent/50"
                  )}
                >
                  <t.icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={() => {
              if (!form.tipoClinica) { toast.error("Selecione o tipo de clínica"); return; }
              setStep(1);
            }}>
              Próximo <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1 - Dados da clínica */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome da Clínica *</Label>
              <Input placeholder="Ex: Clínica São Lucas" value={form.nomeClinica} onChange={(e) => updateForm("nomeClinica", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" placeholder="contato@clinica.com" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-9999" value={form.telefone} onChange={(e) => updateForm("telefone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input placeholder="São Paulo" value={form.cidade} onChange={(e) => updateForm("cidade", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input placeholder="SP" maxLength={2} value={form.estado} onChange={(e) => updateForm("estado", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => updateForm("cnpj", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>CNES</Label>
                <Input placeholder="Cód. Nacional de Saúde" value={form.cnes} onChange={(e) => updateForm("cnes", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button className="flex-1" onClick={() => {
                if (!form.nomeClinica || !form.email) { toast.error("Preencha nome e email"); return; }
                setStep(2);
              }}>
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 - Profissional responsável */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome do Responsável *</Label>
              <Input placeholder="Dr. João Silva" value={form.nomeProfissional} onChange={(e) => updateForm("nomeProfissional", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidade *</Label>
              <Select value={espSel} onValueChange={setEspSel}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {especialidades.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Conselho</Label>
                <Select value={conselhoSel} onValueChange={setConselhoSel}>
                  <SelectTrigger><SelectValue placeholder="CRM" /></SelectTrigger>
                  <SelectContent>
                    {conselhos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input placeholder="12345" value={form.registro} onChange={(e) => updateForm("registro", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input placeholder="SP" maxLength={2} value={form.uf} onChange={(e) => updateForm("uf", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button className="flex-1" onClick={() => {
                if (!form.nomeProfissional) { toast.error("Informe o nome do responsável"); return; }
                setStep(3);
              }}>
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 - Acesso */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={(e) => updateForm("senha", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar Senha *</Label>
              <Input type="password" placeholder="Repita a senha" value={form.confirmarSenha} onChange={(e) => updateForm("confirmarSenha", e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button className="flex-1" disabled={loading} onClick={handleFinish}>
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <a href="/login" className="text-primary hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
