import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, FileText, Pill, Award, Printer } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { toast } from "sonner";
import { printProntuario, printReceita, printAtestado } from "~/lib/pdf";

const getProntuariosData = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and } = await import("drizzle-orm");
  const { patients, professionals, tenants } = await import("~/db/schema");

  const [pacientes, profissionais, tenant] = await Promise.all([
    db.query.patients.findMany({ where: and(eq(patients.tenantId, tenantId), eq(patients.ativo, true)), orderBy: (p, { asc }) => [asc(p.nome)] }),
    db.query.professionals.findMany({ where: and(eq(professionals.tenantId, tenantId), eq(professionals.ativo, true)) }),
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId), columns: { nome: true, cidade: true } }),
  ]);

  return { pacientes, profissionais, nomeClinica: tenant?.nome ?? "Clínica", cidadeClinica: tenant?.cidade ?? "" };
});

const getPacienteRecords = createServerFn({ method: "GET" })
  .validator(z.object({ pacienteId: z.string() }))
  .handler(async ({ data }) => {
    const { requireTenant } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId } = await requireTenant();
    const { eq, and } = await import("drizzle-orm");
    const { records, prescriptions, certificates } = await import("~/db/schema");

    const [prontuarios, receitas, atestados] = await Promise.all([
      db.query.records.findMany({
        where: and(eq(records.tenantId, tenantId), eq(records.pacienteId, data.pacienteId)),
        with: { professional: true },
        orderBy: (r, { desc }) => [desc(r.data)],
      }),
      db.query.prescriptions.findMany({
        where: and(eq(prescriptions.tenantId, tenantId), eq(prescriptions.pacienteId, data.pacienteId)),
        with: { professional: true },
        orderBy: (r, { desc }) => [desc(r.data)],
      }),
      db.query.certificates.findMany({
        where: and(eq(certificates.tenantId, tenantId), eq(certificates.pacienteId, data.pacienteId)),
        with: { professional: true },
        orderBy: (r, { desc }) => [desc(r.dataInicio)],
      }),
    ]);

    return { prontuarios, receitas, atestados };
  });

const salvarProntuario = createServerFn({ method: "POST" })
  .validator(z.object({
    pacienteId: z.string(),
    professionalId: z.string(),
    data: z.string(),
    queixaPrincipal: z.string().optional(),
    historicoClinico: z.string().optional(),
    exameClinico: z.string().optional(),
    diagnostico: z.string().optional(),
    cid: z.string().optional(),
    conduta: z.string().optional(),
    retorno: z.string().optional(),
    observacoes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, CLINICAL_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, CLINICAL_ROLES);
    const { records } = await import("~/db/schema");
    await db.insert(records).values({ id: crypto.randomUUID(), tenantId, ...data });
  });

const salvarReceita = createServerFn({ method: "POST" })
  .validator(z.object({
    pacienteId: z.string(),
    professionalId: z.string(),
    data: z.string(),
    medicamentos: z.string(),
    observacoes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, CLINICAL_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, CLINICAL_ROLES);
    const { prescriptions } = await import("~/db/schema");
    await db.insert(prescriptions).values({ id: crypto.randomUUID(), tenantId, ...data });
  });

const salvarAtestado = createServerFn({ method: "POST" })
  .validator(z.object({
    pacienteId: z.string(),
    professionalId: z.string(),
    data: z.string(),
    tipo: z.string(),
    diasAfastamento: z.number(),
    dataInicio: z.string(),
    dataFim: z.string(),
    cid: z.string().optional(),
    motivo: z.string().optional(),
    cidade: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant, requireRole, CLINICAL_ROLES } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId, userRole } = await requireTenant();
    requireRole(userRole, CLINICAL_ROLES);
    const { certificates } = await import("~/db/schema");
    await db.insert(certificates).values({ id: crypto.randomUUID(), tenantId, ...data as any });
  });

type Medicamento = { nome: string; dosagem: string; via: string; posologia: string; duracao: string; quantidade: string };

export const Route = createFileRoute("/_app/prontuarios/")({
  validateSearch: z.object({ pacienteId: z.string().optional() }),
  component: ProntuariosPage,
});

function ProntuariosPage() {
  const qc = useQueryClient();
  const { pacienteId: pacienteIdParam } = Route.useSearch();
  const [busca, setBusca] = useState("");
  const [pacienteSel, setPacienteSel] = useState<string | null>(pacienteIdParam ?? null);

  const { data: pageData } = useQuery({ queryKey: ["prontuarios-page"], queryFn: () => getProntuariosData() });
  const { data: pacData, isLoading: isLoadingPac } = useQuery({
    queryKey: ["prontuario-pac", pacienteSel],
    queryFn: () => pacienteSel ? getPacienteRecords({ data: { pacienteId: pacienteSel } }) : null,
    enabled: !!pacienteSel,
  });

  const pacienteAtual = pageData?.pacientes.find((p) => p.id === pacienteSel);

  // Prontuário state
  const [openPront, setOpenPront] = useState(false);
  const [proProSel, setProProSel] = useState("");
  const [proData, setProData] = useState(() => new Date().toISOString().slice(0, 10));
  const [proQueixa, setProQueixa] = useState("");
  const [proHist, setProHist] = useState("");
  const [proExame, setProExame] = useState("");
  const [proDiag, setProDiag] = useState("");
  const [proCid, setProCid] = useState("");
  const [proConduta, setProConduta] = useState("");
  const [proRetorno, setProRetorno] = useState("");
  const [proObs, setProObs] = useState("");

  // Receita state
  const [openRec, setOpenRec] = useState(false);
  const [recProSel, setRecProSel] = useState("");
  const [recData, setRecData] = useState(() => new Date().toISOString().slice(0, 10));
  const [recMeds, setRecMeds] = useState<Medicamento[]>([{ nome: "", dosagem: "", via: "Oral", posologia: "", duracao: "", quantidade: "" }]);
  const [recObs, setRecObs] = useState("");

  // Atestado state
  const [openAt, setOpenAt] = useState(false);
  const [atProSel, setAtProSel] = useState("");
  const [atData, setAtData] = useState(() => new Date().toISOString().slice(0, 10));
  const [atTipo, setAtTipo] = useState("afastamento");
  const [atDias, setAtDias] = useState(1);
  const [atDataInicio, setAtDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [atDataFim, setAtDataFim] = useState(() => new Date().toISOString().slice(0, 10));
  const [atCid, setAtCid] = useState("");
  const [atMotivo, setAtMotivo] = useState("");

  // Prontuario detalhe
  const [prontDetalhe, setProntDetalhe] = useState<any | null>(null);

  const savePront = useMutation({
    mutationFn: () => salvarProntuario({
      data: {
        pacienteId: pacienteSel!,
        professionalId: proProSel,
        data: proData,
        queixaPrincipal: proQueixa || undefined,
        historicoClinico: proHist || undefined,
        exameClinico: proExame || undefined,
        diagnostico: proDiag || undefined,
        cid: proCid || undefined,
        conduta: proConduta || undefined,
        retorno: proRetorno || undefined,
        observacoes: proObs || undefined,
      },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["prontuario-pac"] }); toast.success("Prontuário salvo"); setOpenPront(false); },
    onError: () => toast.error("Erro ao salvar"),
  });

  function addMed() {
    setRecMeds((prev) => [...prev, { nome: "", dosagem: "", via: "Oral", posologia: "", duracao: "", quantidade: "" }]);
  }
  function updateMed(i: number, field: keyof Medicamento, value: string) {
    setRecMeds((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }
  function removeMed(i: number) {
    setRecMeds((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSalvarReceita(imprimir: boolean) {
    if (!pacienteSel || !recProSel) { toast.error("Selecione o profissional"); return; }
    const profissional = pageData?.profissionais.find((p) => p.id === recProSel);
    await salvarReceita({
      data: {
        pacienteId: pacienteSel,
        professionalId: recProSel,
        data: recData,
        medicamentos: JSON.stringify(recMeds),
        observacoes: recObs || undefined,
      },
    });
    qc.invalidateQueries({ queryKey: ["prontuario-pac"] });
    toast.success("Receita salva");
    if (imprimir && profissional) {
      printReceita({
        nomePetShop: pageData?.nomeClinica ?? "Clínica",
        medico: profissional.nome,
        registro: [profissional.conselho, profissional.registro, profissional.uf].filter(Boolean).join(" "),
        paciente: pacienteAtual?.nome ?? "",
        data: recData,
        medicamentos: recMeds,
        observacoes: recObs || undefined,
      });
    }
    setOpenRec(false);
    setRecMeds([{ nome: "", dosagem: "", via: "Oral", posologia: "", duracao: "", quantidade: "" }]);
    setRecObs("");
  }

  async function handleSalvarAtestado(imprimir: boolean) {
    if (!pacienteSel || !atProSel) { toast.error("Selecione o profissional"); return; }
    const profissional = pageData?.profissionais.find((p) => p.id === atProSel);
    await salvarAtestado({
      data: {
        pacienteId: pacienteSel,
        professionalId: atProSel,
        data: atData,
        tipo: atTipo,
        diasAfastamento: atDias,
        dataInicio: atDataInicio,
        dataFim: atDataFim,
        cid: atCid || undefined,
        motivo: atMotivo || undefined,
        cidade: pageData?.cidadeClinica || undefined,
      },
    });
    qc.invalidateQueries({ queryKey: ["prontuario-pac"] });
    toast.success("Atestado salvo");
    if (imprimir && profissional) {
      printAtestado({
        nomePetShop: pageData?.nomeClinica ?? "Clínica",
        cidade: pageData?.cidadeClinica ?? "",
        medico: profissional.nome,
        registro: [profissional.conselho, profissional.registro, profissional.uf].filter(Boolean).join(" "),
        paciente: pacienteAtual?.nome ?? "",
        cpf: pacienteAtual?.cpf ?? undefined,
        tipo: atTipo,
        diasAfastamento: atDias,
        dataInicio: atDataInicio,
        dataFim: atDataFim,
        cid: atCid || undefined,
        motivo: atMotivo || undefined,
        data: atData,
      });
    }
    setOpenAt(false);
  }

  const pacientesFiltrados = (pageData?.pacientes ?? []).filter((p) =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const vias = ["Oral", "Tópico", "Injetável", "Inalatório", "Sublingual", "Retal"];

  return (
    <div className="-m-6 flex overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
      {/* Esquerda: lista pacientes */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs" placeholder="Buscar paciente..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pacientesFiltrados.map((p) => (
            <button
              key={p.id}
              onClick={() => setPacienteSel(p.id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                pacienteSel === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50 text-muted-foreground"
              }`}
            >
              {p.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Direita: abas */}
      <div className="flex-1 overflow-y-auto p-6">
        {!pacienteSel ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Selecione um paciente para ver os registros
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">{pacienteAtual?.nome}</h2>
              {pacienteAtual?.cpf && <p className="text-xs text-muted-foreground">CPF: {pacienteAtual.cpf}</p>}
            </div>

            <Tabs defaultValue="prontuarios">
              <TabsList>
                <TabsTrigger value="prontuarios" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Prontuários
                </TabsTrigger>
                <TabsTrigger value="receitas" className="flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5" /> Receitas
                </TabsTrigger>
                <TabsTrigger value="atestados" className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Atestados
                </TabsTrigger>
              </TabsList>

              {/* Prontuários */}
              <TabsContent value="prontuarios">
                <div className="flex justify-end mb-3">
                  <Button size="sm" onClick={() => {
                    setProProSel(""); setProData(new Date().toISOString().slice(0, 10));
                    setProQueixa(""); setProHist(""); setProExame(""); setProDiag("");
                    setProCid(""); setProConduta(""); setProRetorno(""); setProObs("");
                    setOpenPront(true);
                  }}>
                    <Plus className="h-4 w-4" /> Novo Prontuário
                  </Button>
                </div>
                <div className="space-y-3">
                  {isLoadingPac ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : !pacData?.prontuarios.length ? (
                    <p className="text-sm text-muted-foreground">Nenhum prontuário registrado</p>
                  ) : pacData.prontuarios.map((r) => (
                    <Card key={r.id} className="cursor-pointer hover:border-primary/30" onClick={() => setProntDetalhe(r)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                            <p className="text-xs text-muted-foreground">{r.professional?.nome}</p>
                          </div>
                          {r.diagnostico && <Badge variant="outline" className="text-xs max-w-32 truncate">{r.diagnostico}</Badge>}
                        </div>
                        {r.queixaPrincipal && <p className="text-xs text-muted-foreground mt-1 truncate">{r.queixaPrincipal}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Receitas */}
              <TabsContent value="receitas">
                <div className="flex justify-end mb-3">
                  <Button size="sm" onClick={() => {
                    setRecProSel(""); setRecData(new Date().toISOString().slice(0, 10));
                    setRecMeds([{ nome: "", dosagem: "", via: "Oral", posologia: "", duracao: "", quantidade: "" }]);
                    setRecObs(""); setOpenRec(true);
                  }}>
                    <Plus className="h-4 w-4" /> Nova Receita
                  </Button>
                </div>
                <div className="space-y-3">
                  {isLoadingPac ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : !pacData?.receitas.length ? (
                    <p className="text-sm text-muted-foreground">Nenhuma receita registrada</p>
                  ) : pacData.receitas.map((r) => {
                    const meds: Medicamento[] = (() => { try { return JSON.parse(r.medicamentos); } catch { return []; } })();
                    return (
                      <Card key={r.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                              <p className="text-xs text-muted-foreground">{r.professional?.nome}</p>
                              <p className="text-xs text-muted-foreground mt-1">{meds.map((m) => m.nome).filter(Boolean).join(", ")}</p>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => {
                              const prof = pageData?.profissionais.find((p) => p.id === r.professionalId);
                              if (prof) {
                                printReceita({
                                  nomePetShop: pageData?.nomeClinica ?? "",
                                  medico: prof.nome,
                                  registro: [prof.conselho, prof.registro, prof.uf].filter(Boolean).join(" "),
                                  paciente: pacienteAtual?.nome ?? "",
                                  data: r.data,
                                  medicamentos: meds,
                                  observacoes: r.observacoes ?? undefined,
                                });
                              }
                            }}>
                              <Printer className="h-3.5 w-3.5" /> Reimprimir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Atestados */}
              <TabsContent value="atestados">
                <div className="flex justify-end mb-3">
                  <Button size="sm" onClick={() => {
                    setAtProSel(""); setAtData(new Date().toISOString().slice(0, 10));
                    setAtTipo("afastamento"); setAtDias(1);
                    const hoje = new Date().toISOString().slice(0, 10);
                    setAtDataInicio(hoje); setAtDataFim(hoje);
                    setAtCid(""); setAtMotivo(""); setOpenAt(true);
                  }}>
                    <Plus className="h-4 w-4" /> Novo Atestado
                  </Button>
                </div>
                <div className="space-y-3">
                  {isLoadingPac ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : !pacData?.atestados.length ? (
                    <p className="text-sm text-muted-foreground">Nenhum atestado registrado</p>
                  ) : pacData.atestados.map((a) => (
                    <Card key={a.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
                            <p className="text-xs text-muted-foreground">{a.professional?.nome}</p>
                            <p className="text-xs text-muted-foreground capitalize mt-0.5">{a.tipo} · {a.diasAfastamento} dia(s)</p>
                          </div>
                          <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => {
                            const prof = pageData?.profissionais.find((p) => p.id === a.professionalId);
                            if (prof) {
                              printAtestado({
                                nomePetShop: pageData?.nomeClinica ?? "",
                                cidade: a.cidade ?? pageData?.cidadeClinica ?? "",
                                medico: prof.nome,
                                registro: [prof.conselho, prof.registro, prof.uf].filter(Boolean).join(" "),
                                paciente: pacienteAtual?.nome ?? "",
                                cpf: pacienteAtual?.cpf ?? undefined,
                                tipo: a.tipo,
                                diasAfastamento: a.diasAfastamento,
                                dataInicio: a.dataInicio,
                                dataFim: a.dataFim,
                                cid: a.cid ?? undefined,
                                motivo: a.motivo ?? undefined,
                                data: new Date(a.createdAt).toISOString().slice(0, 10),
                              });
                            }
                          }}>
                            <Printer className="h-3.5 w-3.5" /> Reimprimir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Dialog Novo Prontuário */}
      <Dialog open={openPront} onOpenChange={setOpenPront}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Prontuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Profissional *</Label>
                <Select value={proProSel} onValueChange={setProProSel}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{pageData?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={proData} onChange={(e) => setProData(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Queixa Principal</Label>
              <Textarea value={proQueixa} onChange={(e) => setProQueixa(e.target.value)} placeholder="Motivo da consulta" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Histórico Clínico</Label>
              <Textarea value={proHist} onChange={(e) => setProHist(e.target.value)} placeholder="Histórico relevante" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Exame Clínico</Label>
              <Textarea value={proExame} onChange={(e) => setProExame(e.target.value)} placeholder="Achados do exame físico" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Diagnóstico</Label>
                <Input value={proDiag} onChange={(e) => setProDiag(e.target.value)} placeholder="Diagnóstico clínico" />
              </div>
              <div className="space-y-1.5">
                <Label>CID-10</Label>
                <Input value={proCid} onChange={(e) => setProCid(e.target.value)} placeholder="Ex: J00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Conduta</Label>
              <Textarea value={proConduta} onChange={(e) => setProConduta(e.target.value)} placeholder="Tratamento prescrito" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Retorno</Label>
                <Input value={proRetorno} onChange={(e) => setProRetorno(e.target.value)} placeholder="Ex: 30 dias" />
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Input value={proObs} onChange={(e) => setProObs(e.target.value)} placeholder="Observações adicionais" />
              </div>
            </div>
            <Button className="w-full" disabled={savePront.isPending} onClick={() => {
              if (!proProSel) { toast.error("Selecione o profissional"); return; }
              savePront.mutate();
            }}>
              {savePront.isPending ? "Salvando..." : "Salvar Prontuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Prontuário Detalhe */}
      <Dialog open={!!prontDetalhe} onOpenChange={(o) => !o && setProntDetalhe(null)}>
        {prontDetalhe && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle>Prontuário — {new Date(prontDetalhe.data + "T00:00:00").toLocaleDateString("pt-BR")}</DialogTitle>
                <Button variant="outline" size="sm" onClick={() => printProntuario({
                  nomeClinica: pageData?.nomeClinica ?? "Clínica",
                  medico: prontDetalhe.professional?.nome ?? "",
                  registro: [prontDetalhe.professional?.conselho, prontDetalhe.professional?.registro, prontDetalhe.professional?.uf].filter(Boolean).join(" "),
                  paciente: pacienteAtual?.nome ?? "",
                  data: prontDetalhe.data,
                  queixaPrincipal: prontDetalhe.queixaPrincipal ?? undefined,
                  historicoClinico: prontDetalhe.historicoClinico ?? undefined,
                  exameClinico: prontDetalhe.exameClinico ?? undefined,
                  diagnostico: prontDetalhe.diagnostico ?? undefined,
                  cid: prontDetalhe.cid ?? undefined,
                  conduta: prontDetalhe.conduta ?? undefined,
                  retorno: prontDetalhe.retorno ?? undefined,
                  observacoes: prontDetalhe.observacoes ?? undefined,
                })}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">Profissional: <span className="text-foreground font-medium">{prontDetalhe.professional?.nome}</span></p>
              {[
                ["Queixa Principal", prontDetalhe.queixaPrincipal],
                ["Histórico Clínico", prontDetalhe.historicoClinico],
                ["Exame Clínico", prontDetalhe.exameClinico],
                ["Diagnóstico", prontDetalhe.diagnostico],
                ["CID-10", prontDetalhe.cid],
                ["Conduta", prontDetalhe.conduta],
                ["Retorno", prontDetalhe.retorno],
                ["Observações", prontDetalhe.observacoes],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{k}</p>
                  <p>{v}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog Nova Receita */}
      <Dialog open={openRec} onOpenChange={setOpenRec}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Receita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Profissional *</Label>
                <Select value={recProSel} onValueChange={setRecProSel}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{pageData?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={recData} onChange={(e) => setRecData(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medicamentos</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMed} className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              {recMeds.map((m, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2 mb-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input className="h-7 text-xs" value={m.nome} onChange={(e) => updateMed(i, "nome", e.target.value)} placeholder="Amoxicilina" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dosagem</Label>
                      <Input className="h-7 text-xs" value={m.dosagem} onChange={(e) => updateMed(i, "dosagem", e.target.value)} placeholder="500mg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Via</Label>
                      <Select value={m.via} onValueChange={(v) => updateMed(i, "via", v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{vias.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Posologia</Label>
                      <Input className="h-7 text-xs" value={m.posologia} onChange={(e) => updateMed(i, "posologia", e.target.value)} placeholder="1 comp 8/8h" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duração</Label>
                      <Input className="h-7 text-xs" value={m.duracao} onChange={(e) => updateMed(i, "duracao", e.target.value)} placeholder="7 dias" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantidade</Label>
                      <Input className="h-7 text-xs" value={m.quantidade} onChange={(e) => updateMed(i, "quantidade", e.target.value)} placeholder="1 caixa" />
                    </div>
                  </div>
                  {recMeds.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={() => removeMed(i)}>
                      Remover
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={recObs} onChange={(e) => setRecObs(e.target.value)} placeholder="Observações gerais" rows={2} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleSalvarReceita(false)}>Salvar</Button>
              <Button className="flex-1" onClick={() => handleSalvarReceita(true)}>Salvar e Imprimir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Atestado */}
      <Dialog open={openAt} onOpenChange={setOpenAt}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Atestado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Profissional *</Label>
                <Select value={atProSel} onValueChange={setAtProSel}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{pageData?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={atData} onChange={(e) => setAtData(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={atTipo} onValueChange={setAtTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="afastamento">Afastamento</SelectItem>
                  <SelectItem value="comparecimento">Comparecimento</SelectItem>
                  <SelectItem value="escolar">Escolar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {atTipo !== "comparecimento" && (
              <>
                <div className="space-y-1.5">
                  <Label>Dias de Afastamento</Label>
                  <Input type="number" min={1} value={atDias} onChange={(e) => {
                    const d = parseInt(e.target.value) || 1;
                    setAtDias(d);
                    const ini = new Date(atDataInicio + "T00:00:00");
                    const fim = new Date(ini);
                    fim.setDate(fim.getDate() + d - 1);
                    setAtDataFim(fim.toISOString().slice(0, 10));
                  }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Data Início</Label>
                    <Input type="date" value={atDataInicio} onChange={(e) => {
                      setAtDataInicio(e.target.value);
                      const ini = new Date(e.target.value + "T00:00:00");
                      const fim = new Date(ini);
                      fim.setDate(fim.getDate() + atDias - 1);
                      setAtDataFim(fim.toISOString().slice(0, 10));
                    }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data Fim</Label>
                    <Input type="date" value={atDataFim} onChange={(e) => setAtDataFim(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CID-10 (opcional)</Label>
                <Input value={atCid} onChange={(e) => setAtCid(e.target.value)} placeholder="Ex: J06" />
              </div>
              <div className="space-y-1.5">
                <Label>Motivo (opcional)</Label>
                <Input value={atMotivo} onChange={(e) => setAtMotivo(e.target.value)} placeholder="Descrição breve" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleSalvarAtestado(false)}>Salvar</Button>
              <Button className="flex-1" onClick={() => handleSalvarAtestado(true)}>Salvar e Imprimir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
