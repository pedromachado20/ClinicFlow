import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Printer, Sun } from "lucide-react";
import { printFinanceiroAgrupado } from "~/lib/pdf";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "~/lib/utils";

const getFinanceiro = createServerFn({ method: "GET" }).handler(async () => {
  const { requireTenant } = await import("~/server/context");
  const { db } = await import("~/db");
  const { tenantId } = await requireTenant();
  const { eq, and, gte, sql, desc } = await import("drizzle-orm");
  const { transacoes, tenants } = await import("~/db/schema");

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [receitas, despesas, receitaHoje, despesaHoje, lista, tenant] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(valor::numeric), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), gte(transacoes.data, inicioMes))),
    db.select({ total: sql<string>`coalesce(sum(valor::numeric), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "despesa"), gte(transacoes.data, inicioMes))),
    db.select({ total: sql<string>`coalesce(sum(valor::numeric), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "receita"), eq(transacoes.data, hoje))),
    db.select({ total: sql<string>`coalesce(sum(valor::numeric), 0)` }).from(transacoes).where(and(eq(transacoes.tenantId, tenantId), eq(transacoes.tipo, "despesa"), eq(transacoes.data, hoje))),
    db.select({
      id: transacoes.id,
      tipo: transacoes.tipo,
      categoria: transacoes.categoria,
      descricao: transacoes.descricao,
      valor: transacoes.valor,
      data: transacoes.data,
      createdAt: transacoes.createdAt,
    })
    .from(transacoes)
    .where(and(eq(transacoes.tenantId, tenantId), gte(transacoes.data, inicioMes)))
    .orderBy(desc(transacoes.data), desc(transacoes.createdAt))
    .limit(50),

    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId), columns: { nome: true } }),
  ]);

  const totalReceitas = parseFloat(receitas[0]?.total ?? "0");
  const totalDespesas = parseFloat(despesas[0]?.total ?? "0");
  return {
    nomeClinica: tenant?.nome ?? "Clínica",
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    receitaHoje: parseFloat(receitaHoje[0]?.total ?? "0"),
    despesaHoje: parseFloat(despesaHoje[0]?.total ?? "0"),
    transacoes: lista,
  };
});

const criarTransacao = createServerFn({ method: "POST" })
  .validator(z.object({
    tipo: z.enum(["receita", "despesa"]),
    categoria: z.string().min(1),
    descricao: z.string().min(1),
    valor: z.string(),
    data: z.string(),
  }))
  .handler(async ({ data }) => {
    const { requireTenant } = await import("~/server/context");
    const { db } = await import("~/db");
    const { tenantId } = await requireTenant();
    const { transacoes } = await import("~/db/schema");
    await db.insert(transacoes).values({ id: crypto.randomUUID(), tenantId, ...data, pago: true, status: "pago" });
  });

const schema = z.object({
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.string().min(1),
  descricao: z.string().min(1),
  valor: z.string(),
  data: z.string(),
});

const categoriasReceita = ["Consultas Particular", "Consultas Convênio", "Procedimentos", "Exames", "Repasse de Plano", "Outros"];
const categoriasDespesa = ["Salários", "Aluguel", "Equipamentos", "Materiais", "Marketing", "Outros"];

export const Route = createFileRoute("/_app/financeiro/")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro"],
    queryFn: () => getFinanceiro(),
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm({ resolver: zodResolver(schema) });
  const tipoWatch = watch("tipo");

  const criar = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => criarTransacao({ data: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success("Lançamento salvo");
      setOpen(false);
      reset();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const val = (v: string) => isLoading ? "..." : v;

  return (
    <div className="space-y-6">
      {/* Cards do Mês */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Resumo do Mês</p>
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Receitas do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-success">{val(formatCurrency(data?.totalReceitas ?? 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Despesas do Mês</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{val(formatCurrency(data?.totalDespesas ?? 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${(data?.saldo ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                {val(formatCurrency(data?.saldo ?? 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards do Dia */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Resumo de Hoje</p>
        <div className="grid gap-4 grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Receita do Dia</CardTitle>
              <Sun className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-success">{val(formatCurrency(data?.receitaHoje ?? 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Despesa do Dia</CardTitle>
              <Sun className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{val(formatCurrency(data?.despesaHoje ?? 0))}</p></CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de lançamentos */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Lançamentos do Mês</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!data?.transacoes?.length} onClick={() =>
            data && printFinanceiroAgrupado({
              nomeClinica: data.nomeClinica,
              mes: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
              transacoes: data.transacoes,
              totalReceitas: data.totalReceitas,
              totalDespesas: data.totalDespesas,
              saldo: data.saldo,
            })
          }>
            <Printer className="h-4 w-4" /> PDF
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> Lançamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((v) => criar.mutate(v))} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select onValueChange={(v) => { setValue("tipo", v as any); setValue("categoria", ""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria *</Label>
                  <Select onValueChange={(v) => setValue("categoria", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(tipoWatch === "receita" ? categoriasReceita : categoriasDespesa).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição *</Label>
                  <Input {...register("descricao")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Valor (R$)</Label>
                    <Input {...register("valor")} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data</Label>
                    <Input type="date" {...register("data")} defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={criar.isPending}>
                  {criar.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !data?.transacoes?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum lançamento este mês</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.transacoes.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium text-sm">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.categoria} · {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className={`font-bold ${t.tipo === "receita" ? "text-success" : "text-destructive"}`}>
                  {t.tipo === "receita" ? "+" : "-"}{formatCurrency(t.valor)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
