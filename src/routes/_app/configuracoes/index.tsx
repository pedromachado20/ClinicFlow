import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Wifi, BookOpen, ExternalLink, CheckCircle2, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { requireAdminRoute } from "~/lib/utils";

const getConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq } = await import("drizzle-orm");
  const { tenants } = await import("~/db/schema");
  return db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
});

const salvarDados = createServerFn({ method: "POST" })
  .validator(z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    telefone: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cnpj: z.string().optional(),
    cnes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { eq } = await import("drizzle-orm");
    const { tenants } = await import("~/db/schema");
    await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, tenantId));
  });

const salvarWhatsapp = createServerFn({ method: "POST" })
  .validator(z.object({
    whatsappAtivo: z.boolean(),
    whatsappProvider: z.string(),
    evolutionApiUrl: z.string().optional(),
    evolutionApiKey: z.string().optional(),
    evolutionInstance: z.string().optional(),
    zapiClientToken: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { eq } = await import("drizzle-orm");
    const { tenants } = await import("~/db/schema");
    await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, tenantId));
  });

const testarConexao = createServerFn({ method: "POST" })
  .validator(z.object({ telefone: z.string().min(10) }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { eq } = await import("drizzle-orm");
    const { tenants } = await import("~/db/schema");

    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant?.whatsappAtivo || tenant.whatsappProvider === "nenhum") {
      throw new Error("WhatsApp não configurado");
    }

    const numero = data.telefone.replace(/\D/g, "");
    const payload = { phone: `55${numero}`, message: "Conexão com ClinicFlow testada com sucesso!" };

    if (tenant.whatsappProvider === "z-api") {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Client-Token": tenant.zapiClientToken ?? "",
      };
      const url = `${tenant.evolutionApiUrl}/instances/${tenant.evolutionInstance}/token/${tenant.evolutionApiKey}/send-text`;
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Erro Z-API: ${res.status}`);
    } else if (tenant.whatsappProvider === "evolution") {
      const res = await fetch(`${tenant.evolutionApiUrl}/message/sendText/${tenant.evolutionInstance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": tenant.evolutionApiKey ?? "" },
        body: JSON.stringify({ number: `55${numero}`, text: payload.message }),
      });
      if (!res.ok) throw new Error(`Erro Evolution: ${res.status}`);
    }

    return { ok: true };
  });

const salvarNotificacoes = createServerFn({ method: "POST" })
  .validator(z.object({
    notifAgendamento: z.boolean(),
    notifLembrete: z.boolean(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { eq } = await import("drizzle-orm");
    const { tenants } = await import("~/db/schema");
    await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, tenantId));
  });

const membroRoleEnum = z.enum(["admin", "medico", "recepcionista"]);

const getEquipe = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId, userRole } = await requireTenant();
  requireRole(userRole, ADMIN_ROLES);
  const { eq, and } = await import("drizzle-orm");
  const { users } = await import("~/db/schema");
  return db.query.users.findMany({
    where: and(eq(users.tenantId, tenantId)),
    columns: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });
});

const criarMembro = createServerFn({ method: "POST" })
  .validator(z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    senha: z.string().min(6),
    role: membroRoleEnum,
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { auth } = await import("~/lib/auth");
    const { db } = await import("~/db");
    const { eq } = await import("drizzle-orm");
    const { users } = await import("~/db/schema");

    let signUpResult;
    try {
      signUpResult = await auth.api.signUpEmail({
        body: { name: data.nome, email: data.email, password: data.senha },
      });
    } catch {
      throw new Error("Não foi possível criar o acesso — verifique se o e-mail já está em uso");
    }
    if (!signUpResult.user) throw new Error("Não foi possível criar o acesso");

    await db.update(users)
      .set({ tenantId, role: data.role })
      .where(eq(users.id, signUpResult.user.id));
  });

const redefinirSenhaMembro = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), novaSenha: z.string().min(6) }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { db } = await import("~/db");
    const { eq, and } = await import("drizzle-orm");
    const { users, accounts } = await import("~/db/schema");
    const { hashPassword } = await import("better-auth/crypto");

    const alvo = await db.query.users.findFirst({ where: and(eq(users.id, data.userId), eq(users.tenantId, tenantId)) });
    if (!alvo) throw new Error("Usuário não encontrado");

    const hash = await hashPassword(data.novaSenha);
    await db.update(accounts)
      .set({ password: hash, updatedAt: new Date() })
      .where(and(eq(accounts.userId, data.userId), eq(accounts.providerId, "credential")));
  });

const alterarRoleMembro = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), role: membroRoleEnum }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    const { db } = await import("~/db");
    const { eq, and } = await import("drizzle-orm");
    const { users } = await import("~/db/schema");
    await db.update(users).set({ role: data.role, updatedAt: new Date() })
      .where(and(eq(users.id, data.userId), eq(users.tenantId, tenantId)));
  });

const alterarAtivoMembro = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), ativo: z.boolean() }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, ADMIN_ROLES } = await import("~/server/context");
    const { tenantId, userId, userRole } = await requireTenant();
    requireRole(userRole, ADMIN_ROLES);
    if (data.userId === userId) throw new Error("Você não pode desativar sua própria conta");
    const { db } = await import("~/db");
    const { eq, and } = await import("drizzle-orm");
    const { users } = await import("~/db/schema");
    await db.update(users).set({ ativo: data.ativo, updatedAt: new Date() })
      .where(and(eq(users.id, data.userId), eq(users.tenantId, tenantId)));
  });

const schemaDados = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cnpj: z.string().optional(),
  cnes: z.string().optional(),
});

const tiposClinica = [
  { value: "clinica_medica", label: "Clínica Médica" },
  { value: "consultorio_dentario", label: "Consultório Dentário" },
  { value: "consultorio_psicologia", label: "Consultório de Psicologia" },
  { value: "clinica_fisioterapia", label: "Clínica de Fisioterapia" },
  { value: "outro", label: "Outro" },
];

export const Route = createFileRoute("/_app/configuracoes/")({
  beforeLoad: requireAdminRoute,
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => getConfig(),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemaDados),
    values: data ? {
      nome: data.nome,
      email: data.email,
      telefone: data.telefone ?? "",
      cidade: data.cidade ?? "",
      estado: data.estado ?? "",
      cnpj: data.cnpj ?? "",
      cnes: data.cnes ?? "",
    } : undefined,
  });

  const salvarDadosMut = useMutation({
    mutationFn: (v: z.infer<typeof schemaDados>) => salvarDados({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["configuracoes"] }); toast.success("Dados salvos"); },
    onError: () => toast.error("Erro ao salvar"),
  });

  // WhatsApp state
  const [provider, setProvider] = useState("nenhum");
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [wppUrl, setWppUrl] = useState("");
  const [wppToken, setWppToken] = useState("");
  const [wppInstance, setWppInstance] = useState("");
  const [wppClientToken, setWppClientToken] = useState("");
  const [telefoneTest, setTelefoneTest] = useState("");

  useEffect(() => {
    if (!data) return;
    setProvider(data.whatsappProvider ?? "nenhum");
    setWhatsappAtivo(data.whatsappAtivo ?? false);
    setWppUrl(data.evolutionApiUrl ?? "");
    setWppToken(data.evolutionApiKey ?? "");
    setWppInstance(data.evolutionInstance ?? "");
    setWppClientToken(data.zapiClientToken ?? "");
  }, [data]);

  const salvarWppMut = useMutation({
    mutationFn: () => salvarWhatsapp({
      data: {
        whatsappAtivo,
        whatsappProvider: provider,
        evolutionApiUrl: wppUrl || undefined,
        evolutionApiKey: wppToken || undefined,
        evolutionInstance: wppInstance || undefined,
        zapiClientToken: wppClientToken || undefined,
      },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["configuracoes"] }); toast.success("WhatsApp salvo"); },
    onError: () => toast.error("Erro ao salvar WhatsApp"),
  });

  const testarMut = useMutation({
    mutationFn: () => testarConexao({ data: { telefone: telefoneTest } }),
    onSuccess: () => toast.success("Mensagem de teste enviada!"),
    onError: (e: any) => toast.error(e.message ?? "Erro ao testar conexão"),
  });

  // Notificações
  const [notifs, setNotifs] = useState({
    notifAgendamento: false,
    notifLembrete: false,
  });

  useEffect(() => {
    if (!data) return;
    setNotifs({
      notifAgendamento: data.notifAgendamento ?? false,
      notifLembrete: data.notifLembrete ?? false,
    });
  }, [data]);

  const salvarNotifMut = useMutation({
    mutationFn: () => salvarNotificacoes({ data: notifs }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["configuracoes"] }); toast.success("Notificações salvas"); },
    onError: () => toast.error("Erro ao salvar"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-xl space-y-6">

      {/* Dados da Clínica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => salvarDadosMut.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input {...register("nome")} placeholder="Nome da clínica ou consultório" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <p className="text-sm text-muted-foreground">
                {tiposClinica.find((t) => t.value === data?.tipo)?.label ?? data?.tipo ?? "-"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input {...register("email")} type="email" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register("telefone")} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1.5">
                <Label>CNES</Label>
                <Input {...register("cnes")} placeholder="Código CNES" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register("cidade")} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input {...register("estado")} maxLength={2} placeholder="SP" />
              </div>
            </div>
            <Button type="submit" disabled={salvarDadosMut.isPending}>
              {salvarDadosMut.isPending ? "Salvando..." : "Salvar Dados"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base">Integração WhatsApp</CardTitle>
            <CardDescription className="mt-1">
              Envie mensagens automáticas para seus pacientes via WhatsApp. A integração é opcional — o sistema funciona normalmente sem ela.
            </CardDescription>
          </div>
          {whatsappAtivo && <Badge variant="success">Ativo</Badge>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
            <div>
              <p className="text-sm font-medium">Ativar integração WhatsApp</p>
              <p className="text-xs text-muted-foreground">Quando ativo, mensagens automáticas serão enviadas conforme as notificações configuradas</p>
            </div>
            <Switch checked={whatsappAtivo} onCheckedChange={setWhatsappAtivo} />
          </div>

          <div className="space-y-1.5">
            <Label>Provedor *</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum</SelectItem>
                <SelectItem value="z-api">Z-API</SelectItem>
                <SelectItem value="evolution">Evolution API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider === "z-api" && (
            <>
              <div className="rounded-lg border border-info/30 bg-info/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-info">
                  <BookOpen className="h-4 w-4" />
                  Passo a passo — Z-API
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground list-none">
                  {[
                    "Acesse z-api.io e crie uma conta (gratuita para testes)",
                    'No painel, clique em "Nova Instância" e dê um nome (ex: clinicflow)',
                    "Aguarde a instância ser criada e copie o ID da instância e o Token",
                    "Vá em Segurança → Security Token e copie o Client Token",
                    'Conecte o WhatsApp: clique em "Conectar" e escaneie o QR Code com o celular',
                    "Cole os valores nos campos abaixo e salve. Teste com seu número.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-info" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground">
                  A URL padrão da Z-API é <code className="bg-muted px-1 rounded text-xs">https://api.z-api.io</code>. Substitua pelo endpoint da sua instância se usar plano dedicado.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>URL da Instância *</Label>
                <Input value={wppUrl} onChange={(e) => setWppUrl(e.target.value)} placeholder="https://api.z-api.io" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Token *</Label>
                  <Input type="password" value={wppToken} onChange={(e) => setWppToken(e.target.value)} placeholder="Token da instância" />
                </div>
                <div className="space-y-1.5">
                  <Label>ID da Instância *</Label>
                  <Input value={wppInstance} onChange={(e) => setWppInstance(e.target.value)} placeholder="ID da instância" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Client Token{" "}
                  <span className="text-muted-foreground font-normal">(Segurança → Security Token no Z-API)</span>
                </Label>
                <Input type="password" value={wppClientToken} onChange={(e) => setWppClientToken(e.target.value)} placeholder="Security Token" />
              </div>
            </>
          )}

          {provider === "evolution" && (
            <>
              <div className="rounded-lg border border-info/30 bg-info/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-info">
                  <BookOpen className="h-4 w-4" />
                  Passo a passo — Evolution API
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground list-none">
                  {[
                    "Instale a Evolution API no seu servidor (VPS ou Docker). Documentação: doc.evolution-api.com",
                    "Após instalar, acesse o painel e vá em Manager → Create Instance",
                    "Defina um nome para a instância (ex: clinicflow) e clique em Criar",
                    "Na instância criada, acesse QR Code e escaneie com o WhatsApp do celular",
                    "Copie a API Key global (Settings → Global API Key) ou a key da instância",
                    "Cole a URL do seu servidor, a API Key e o nome da instância nos campos abaixo e salve.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-info" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground">
                  Exemplo de URL: <code className="bg-muted px-1 rounded text-xs">https://evolution.meuservidor.com.br</code> (sem barra no final).
                  Se usar porta customizada, inclua na URL: <code className="bg-muted px-1 rounded text-xs">https://meuservidor.com:8080</code>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>URL da API *</Label>
                <Input value={wppUrl} onChange={(e) => setWppUrl(e.target.value)} placeholder="https://sua-evolution.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>API Key *</Label>
                  <Input type="password" value={wppToken} onChange={(e) => setWppToken(e.target.value)} placeholder="API Key" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome da Instância *</Label>
                  <Input value={wppInstance} onChange={(e) => setWppInstance(e.target.value)} placeholder="minha-instancia" />
                </div>
              </div>
            </>
          )}

          {provider !== "nenhum" && (
            <div className="space-y-1.5">
              <Label>Número para teste (com DDD)</Label>
              <div className="flex gap-2">
                <Input
                  value={telefoneTest}
                  onChange={(e) => setTelefoneTest(e.target.value)}
                  placeholder="11999999999"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => testarMut.mutate()}
                  disabled={testarMut.isPending || !telefoneTest}
                >
                  <Wifi className="h-4 w-4" />
                  {testarMut.isPending ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>
          )}

          <Button onClick={() => salvarWppMut.mutate()} disabled={salvarWppMut.isPending}>
            {salvarWppMut.isPending ? "Salvando..." : "Salvar WhatsApp"}
          </Button>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificações Automáticas</CardTitle>
          <CardDescription>Mensagens enviadas automaticamente via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "notifAgendamento", label: "Novo agendamento", desc: "Confirmação enviada ao paciente ao agendar" },
            { key: "notifLembrete",    label: "Lembrete",          desc: "Aviso ao paciente antes do horário da consulta" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={notifs[key as keyof typeof notifs]}
                onCheckedChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
          <Button onClick={() => salvarNotifMut.mutate()} disabled={salvarNotifMut.isPending}>
            {salvarNotifMut.isPending ? "Salvando..." : "Salvar Notificações"}
          </Button>
        </CardContent>
      </Card>

      <EquipeCard />
    </div>
  );
}

function EquipeCard() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [novoMembro, setNovoMembro] = useState<{ nome: string; email: string; senha: string; role: "admin" | "medico" | "recepcionista" }>({ nome: "", email: "", senha: "", role: "recepcionista" });
  const [novaSenha, setNovaSenha] = useState("");

  const { data: equipe, isLoading } = useQuery({
    queryKey: ["equipe"],
    queryFn: () => getEquipe(),
  });

  const criarMut = useMutation({
    mutationFn: () => criarMembro({ data: novoMembro }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipe"] });
      toast.success("Membro adicionado");
      setAddOpen(false);
      setNovoMembro({ nome: "", email: "", senha: "", role: "recepcionista" });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao adicionar membro"),
  });

  const resetMut = useMutation({
    mutationFn: () => redefinirSenhaMembro({ data: { userId: resetUserId as string, novaSenha } }),
    onSuccess: () => {
      toast.success("Senha redefinida");
      setResetUserId(null);
      setNovaSenha("");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao redefinir senha"),
  });

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "medico" | "recepcionista" }) => alterarRoleMembro({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipe"] }); toast.success("Papel atualizado"); },
    onError: () => toast.error("Erro ao atualizar papel"),
  });

  const ativoMut = useMutation({
    mutationFn: (v: { userId: string; ativo: boolean }) => alterarAtivoMembro({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipe"] }); toast.success("Atualizado"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Equipe</CardTitle>
          <CardDescription className="mt-1">Gerencie os usuários com acesso a esta clínica</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar membro da equipe</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={novoMembro.nome} onChange={(e) => setNovoMembro((p) => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={novoMembro.email} onChange={(e) => setNovoMembro((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Senha provisória</Label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={novoMembro.senha} onChange={(e) => setNovoMembro((p) => ({ ...p, senha: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Papel</Label>
                <Select value={novoMembro.role} onValueChange={(v) => setNovoMembro((p) => ({ ...p, role: v as "admin" | "medico" | "recepcionista" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="medico">Profissional</SelectItem>
                    <SelectItem value="recepcionista">Recepção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={criarMut.isPending || !novoMembro.nome || !novoMembro.email || novoMembro.senha.length < 6}
                onClick={() => criarMut.mutate()}
              >
                {criarMut.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : equipe?.length ? (
          equipe.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.role === "owner" ? (
                  <Badge variant="secondary">Dono</Badge>
                ) : (
                  <Select
                    value={u.role ?? "recepcionista"}
                    onValueChange={(v) => roleMut.mutate({ userId: u.id, role: v as "admin" | "medico" | "recepcionista" })}
                  >
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="medico">Profissional</SelectItem>
                      <SelectItem value="recepcionista">Recepção</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" className="h-8" onClick={() => setResetUserId(u.id)}>
                  <KeyRound className="h-3.5 w-3.5" />
                </Button>
                {u.role !== "owner" && (
                  <Switch checked={u.ativo} onCheckedChange={(v) => ativoMut.mutate({ userId: u.id, ativo: v })} />
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum membro cadastrado</p>
        )}
      </CardContent>

      <Dialog open={!!resetUserId} onOpenChange={(v) => !v && setResetUserId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            </div>
            <Button className="w-full" disabled={resetMut.isPending || novaSenha.length < 6} onClick={() => resetMut.mutate()}>
              {resetMut.isPending ? "Salvando..." : "Redefinir senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
