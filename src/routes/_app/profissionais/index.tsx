import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Phone, Pencil, Trash2, Printer, Camera, X } from "lucide-react";
import { printTable } from "~/lib/pdf";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { formatPhone } from "~/lib/utils";

const getProfissionais = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and } = await import("drizzle-orm");
  const { professionals } = await import("~/db/schema");
  return db.query.professionals.findMany({
    where: and(eq(professionals.tenantId, tenantId), eq(professionals.ativo, true)),
    orderBy: (p, { asc }) => [asc(p.nome)],
  });
});

const salvarProfissional = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string().optional(),
    nome: z.string().min(2),
    especialidade: z.string(),
    registro: z.string().optional(),
    conselho: z.string().optional(),
    uf: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().optional(),
    cor: z.string().optional(),
    comissao: z.string().optional(),
    fotoUrl: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId } = await requireTenant();
    const { professionals } = await import("~/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const payload = { ...data, especialidade: data.especialidade as any };
    if (data.id) {
      await db.update(professionals).set({ ...payload, updatedAt: new Date() }).where(and(eq(professionals.id, data.id), eq(professionals.tenantId, tenantId)));
    } else {
      await db.insert(professionals).values({ id: crypto.randomUUID(), tenantId, ...payload });
    }
  });

const excluirProfissional = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { requireTenant } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId } = await requireTenant();
    const { professionals } = await import("~/db/schema");
    const { eq, and } = await import("drizzle-orm");
    await db.update(professionals).set({ ativo: false }).where(and(eq(professionals.id, data.id), eq(professionals.tenantId, tenantId)));
  });

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

type Profissional = Awaited<ReturnType<typeof getProfissionais>>[number];

export const Route = createFileRoute("/_app/profissionais/")({
  component: ProfissionaisPage,
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

function ProfissionaisPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Profissional | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [espSel, setEspSel] = useState("");
  const [conselhoSel, setConselhoSel] = useState("");

  const [fNome, setFNome] = useState("");
  const [fRegistro, setFRegistro] = useState("");
  const [fUf, setFUf] = useState("");
  const [fTelefone, setFTelefone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fCor, setFCor] = useState("#0ea5e9");
  const [fComissao, setFComissao] = useState("");
  const [fFoto, setFFoto] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["profissionais"],
    queryFn: () => getProfissionais(),
  });

  function abrirNovo() {
    setEditando(null);
    setEspSel(""); setConselhoSel("");
    setFNome(""); setFRegistro(""); setFUf(""); setFTelefone(""); setFEmail(""); setFCor("#0ea5e9"); setFComissao(""); setFFoto("");
    setOpen(true);
  }

  function abrirEditar(p: Profissional) {
    setEditando(p);
    setEspSel(p.especialidade);
    setConselhoSel(p.conselho ?? "");
    setFNome(p.nome); setFRegistro(p.registro ?? ""); setFUf(p.uf ?? "");
    setFTelefone(p.telefone ?? ""); setFEmail(p.email ?? ""); setFCor(p.cor); setFComissao(p.comissao ?? "");
    setFFoto((p as any).fotoUrl ?? "");
    setOpen(true);
  }

  const salvar = useMutation({
    mutationFn: () => salvarProfissional({
      data: {
        id: editando?.id, nome: fNome, especialidade: espSel || "medico",
        registro: fRegistro || undefined, conselho: conselhoSel || undefined, uf: fUf || undefined,
        telefone: fTelefone || undefined, email: fEmail || undefined, cor: fCor, comissao: fComissao || undefined,
        fotoUrl: fFoto || undefined,
      },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profissionais"] }); toast.success(editando ? "Atualizado" : "Cadastrado"); setOpen(false); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirProfissional({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profissionais"] }); toast.success("Removido"); setExcluindo(null); },
    onError: () => toast.error("Erro ao remover"),
  });

  function handlePrint() {
    printTable("Profissionais", ["Nome", "Especialidade", "Conselho", "Registro", "UF", "Telefone", "Comissão (%)"],
      data.map((p) => [
        p.nome,
        especialidades.find((e) => e.value === p.especialidade)?.label ?? p.especialidade,
        p.conselho ?? "-", p.registro ?? "-", p.uf ?? "-",
        p.telefone ?? "-", p.comissao ?? "-",
      ])
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={!data.length}>
          <Printer className="h-4 w-4" /> PDF
        </Button>
        <Button size="sm" onClick={abrirNovo}><Plus className="h-4 w-4" /> Novo Profissional</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editando ? "Editar Profissional" : "Novo Profissional"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!fNome) { toast.error("Nome obrigatório"); return; } salvar.mutate(); }} className="space-y-3">
            <div className="flex justify-center pb-2">
              <FotoUpload foto={fFoto} onChange={setFFoto} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Dr. Nome Completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidade *</Label>
              <Select value={espSel} onValueChange={setEspSel}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{especialidades.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label>Conselho</Label>
                <Select value={conselhoSel} onValueChange={setConselhoSel}>
                  <SelectTrigger><SelectValue placeholder="CRM" /></SelectTrigger>
                  <SelectContent>{conselhos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input value={fRegistro} onChange={(e) => setFRegistro(e.target.value)} placeholder="12345" />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input value={fUf} onChange={(e) => setFUf(e.target.value)} placeholder="SP" maxLength={2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={fTelefone} onChange={(e) => setFTelefone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="dr@clinica.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cor na agenda</Label>
                <Input type="color" value={fCor} onChange={(e) => setFCor(e.target.value)} className="h-9 cursor-pointer" />
              </div>
              <div className="space-y-1.5">
                <Label>Comissão (%)</Label>
                <Input value={fComissao} onChange={(e) => setFComissao(e.target.value)} placeholder="0" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : editando ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover profissional?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O profissional será desativado e não aparecerá mais na agenda.</p>
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
      ) : !data.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum profissional cadastrado</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {(p as any).fotoUrl ? (
                    <img src={(p as any).fotoUrl} alt={p.nome} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: p.cor }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.nome}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{especialidades.find((e) => e.value === p.especialidade)?.label ?? p.especialidade}</Badge>
                  </div>
                </div>
                {(p.conselho || p.registro) && (
                  <p className="text-xs text-muted-foreground">
                    {[p.conselho, p.registro, p.uf].filter(Boolean).join(" ")}
                  </p>
                )}
                {p.telefone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {formatPhone(p.telefone)}
                  </div>
                )}
                {p.comissao && parseFloat(p.comissao) > 0 && (
                  <p className="text-xs text-muted-foreground">Comissão: {p.comissao}%</p>
                )}
                <div className="flex gap-1 pt-1 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => abrirEditar(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs text-destructive hover:text-destructive" onClick={() => setExcluindo(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
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
