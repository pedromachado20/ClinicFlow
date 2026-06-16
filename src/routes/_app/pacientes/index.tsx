import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Phone, Mail, Pencil, Trash2, Printer, Search, Camera, X, FileText } from "lucide-react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { formatPhone, calcularIdade } from "~/lib/utils";
import { printTable } from "~/lib/pdf";

const getPacientes = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and } = await import("drizzle-orm");
  const { patients } = await import("~/db/schema");
  return db.query.patients.findMany({
    where: and(eq(patients.tenantId, tenantId), eq(patients.ativo, true)),
    orderBy: (p, { asc }) => [asc(p.nome)],
  });
});

const salvarPaciente = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string().optional(),
    nome: z.string().min(2),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    dataNascimento: z.string().optional(),
    sexo: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().optional(),
    convenio: z.string().optional(),
    numeroConvenio: z.string().optional(),
    tipoSanguineo: z.string().optional(),
    alergias: z.string().optional(),
    observacoes: z.string().optional(),
    fotoUrl: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId } = await requireTenant();
    const { patients } = await import("~/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const payload = { ...data, sexo: (data.sexo || undefined) as any };
    if (data.id) {
      await db.update(patients).set({ ...payload, updatedAt: new Date() }).where(and(eq(patients.id, data.id), eq(patients.tenantId, tenantId)));
    } else {
      await db.insert(patients).values({ id: crypto.randomUUID(), tenantId, ...payload });
    }
  });

const excluirPaciente = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { requireTenant } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId } = await requireTenant();
    const { patients } = await import("~/db/schema");
    const { eq, and } = await import("drizzle-orm");
    await db.update(patients).set({ ativo: false }).where(and(eq(patients.id, data.id), eq(patients.tenantId, tenantId)));
  });

type Patient = Awaited<ReturnType<typeof getPacientes>>[number];

export const Route = createFileRoute("/_app/pacientes/")({
  component: PacientesPage,
});

function FotoUpload({ foto, onChange }: { foto: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange((ev.target?.result as string) ?? "");
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-24 w-24 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-muted"
        onClick={() => ref.current?.click()}
      >
        {foto ? (
          <>
            <img src={foto} alt="Foto" className="h-24 w-24 object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Camera className="h-6 w-6" />
            <span className="text-xs">Foto</span>
          </div>
        )}
      </div>
      {foto && (
        <button type="button" className="text-xs text-destructive flex items-center gap-1" onClick={() => onChange("")}>
          <X className="h-3 w-3" /> Remover
        </button>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

function PacientesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Patient | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [sexoSel, setSexoSel] = useState("");

  const [fNome, setFNome] = useState("");
  const [fCpf, setFCpf] = useState("");
  const [fRg, setFRg] = useState("");
  const [fDataNasc, setFDataNasc] = useState("");
  const [fTelefone, setFTelefone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fConvenio, setFConvenio] = useState("");
  const [fNumConvenio, setFNumConvenio] = useState("");
  const [fTipoSang, setFTipoSang] = useState("");
  const [fAlergias, setFAlergias] = useState("");
  const [fObs, setFObs] = useState("");
  const [fFoto, setFFoto] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["pacientes"],
    queryFn: () => getPacientes(),
  });

  const pacientesFiltrados = data.filter((p) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return p.nome.toLowerCase().includes(b) || (p.cpf ?? "").includes(b) || (p.telefone ?? "").includes(b);
  });

  function abrirNovo() {
    setEditando(null);
    setSexoSel("");
    setFNome(""); setFCpf(""); setFRg(""); setFDataNasc(""); setFTelefone("");
    setFEmail(""); setFConvenio(""); setFNumConvenio(""); setFTipoSang(""); setFAlergias(""); setFObs(""); setFFoto("");
    setOpen(true);
  }

  function abrirEditar(p: Patient) {
    setEditando(p);
    setSexoSel(p.sexo ?? "");
    setFNome(p.nome); setFCpf(p.cpf ?? ""); setFRg(p.rg ?? ""); setFDataNasc(p.dataNascimento ?? "");
    setFTelefone(p.telefone ?? ""); setFEmail(p.email ?? ""); setFConvenio(p.convenio ?? "");
    setFNumConvenio(p.numeroConvenio ?? ""); setFTipoSang(p.tipoSanguineo ?? ""); setFAlergias(p.alergias ?? ""); setFObs(p.observacoes ?? "");
    setFFoto(p.fotoUrl ?? "");
    setOpen(true);
  }

  const salvar = useMutation({
    mutationFn: () => salvarPaciente({
      data: {
        id: editando?.id, nome: fNome, cpf: fCpf || undefined, rg: fRg || undefined,
        dataNascimento: fDataNasc || undefined, sexo: sexoSel || undefined,
        telefone: fTelefone || undefined, email: fEmail || undefined,
        convenio: fConvenio || undefined, numeroConvenio: fNumConvenio || undefined,
        tipoSanguineo: fTipoSang || undefined, alergias: fAlergias || undefined,
        observacoes: fObs || undefined, fotoUrl: fFoto || undefined,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success(editando ? "Paciente atualizado" : "Paciente cadastrado");
      setOpen(false);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirPaciente({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success("Paciente removido");
      setExcluindo(null);
    },
    onError: () => toast.error("Erro ao remover"),
  });

  function handlePrint() {
    printTable("Pacientes", ["Nome", "CPF", "Telefone", "Email", "Convênio", "Tipo Sanguíneo"],
      data.map((p) => [p.nome, p.cpf ?? "-", p.telefone ?? "-", p.email ?? "-", p.convenio ?? "-", p.tipoSanguineo ?? "-"])
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, CPF ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={!data.length}>
          <Printer className="h-4 w-4" /> PDF
        </Button>
        <Button size="sm" onClick={abrirNovo}><Plus className="h-4 w-4" /> Novo Paciente</Button>
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Paciente" : "Novo Paciente"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!fNome) { toast.error("Nome obrigatório"); return; } salvar.mutate(); }} className="space-y-3">
            <div className="flex justify-center pb-2">
              <FotoUpload foto={fFoto} onChange={setFFoto} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={fCpf} onChange={(e) => setFCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1.5">
                <Label>RG</Label>
                <Input value={fRg} onChange={(e) => setFRg(e.target.value)} placeholder="RG" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={fDataNasc} onChange={(e) => setFDataNasc(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select value={sexoSel} onValueChange={setSexoSel}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={fTelefone} onChange={(e) => setFTelefone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Convênio</Label>
                <Input value={fConvenio} onChange={(e) => setFConvenio(e.target.value)} placeholder="Nome do plano" />
              </div>
              <div className="space-y-1.5">
                <Label>Nº Convênio</Label>
                <Input value={fNumConvenio} onChange={(e) => setFNumConvenio(e.target.value)} placeholder="Número" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo Sanguíneo</Label>
                <Input value={fTipoSang} onChange={(e) => setFTipoSang(e.target.value)} placeholder="A+, B-, O+" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alergias</Label>
              <Input value={fAlergias} onChange={(e) => setFAlergias(e.target.value)} placeholder="Penicilina, dipirona..." />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input value={fObs} onChange={(e) => setFObs(e.target.value)} placeholder="Observações gerais" />
            </div>
            <Button type="submit" className="w-full" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : editando ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmação exclusão */}
      <Dialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover paciente?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O paciente será desativado do sistema.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setExcluindo(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" disabled={excluir.isPending} onClick={() => excluir.mutate(excluindo!)}>
              {excluir.isPending ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !pacientesFiltrados.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {busca ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pacientesFiltrados.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {p.fotoUrl ? (
                    <img src={p.fotoUrl} alt={p.nome} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.nome}</p>
                    {p.dataNascimento && (
                      <p className="text-xs text-muted-foreground">{calcularIdade(p.dataNascimento)}</p>
                    )}
                  </div>
                </div>
                {p.telefone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {formatPhone(p.telefone)}
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> <span className="truncate">{p.email}</span>
                  </div>
                )}
                {p.convenio && (
                  <Badge variant="outline" className="text-xs">{p.convenio}</Badge>
                )}
                <div className="flex gap-1 pt-1 border-t border-border">
                  <Link
                    to="/prontuarios"
                    search={{ pacienteId: p.id }}
                    className="flex-1"
                  >
                    <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-primary hover:text-primary">
                      <FileText className="h-3.5 w-3.5" /> Prontuário
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => abrirEditar(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-destructive hover:text-destructive" onClick={() => setExcluindo(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
