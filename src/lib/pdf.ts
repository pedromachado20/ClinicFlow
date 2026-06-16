import { formatCurrency, extenso } from "./utils";

function openPrint(html: string) {
  const win = window.open("", "_blank");
  if (!win) { alert("Pop-up bloqueado. Permita pop-ups para imprimir."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 20px; }
  h1 { font-size: 17px; margin: 0 0 3px; }
  .sub { font-size: 10px; color: #777; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f4f4f4; text-align: left; padding: 7px 8px; border-bottom: 2px solid #ddd; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  @media print { body { padding: 12px; } }
`;

export function printRelatorio(opts: {
  nomeClinica: string;
  consultasHoje: number;
  receitaHoje: number;
  particularHoje: number;
  convenioHoje: number;
  totalPacientes: number;
  totalConsultas: number;
  receitaMes: number;
  taxaComparecimento: number;
  particularMes: number;
  convenioMes: number;
  topServicos: { nome: string | null; total: number }[];
}) {
  const fmtR = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const mes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const hoje = new Date().toLocaleDateString("pt-BR");
  const totalTipo = opts.particularMes + opts.convenioMes || 1;
  const pctPart = Math.round((opts.particularMes / totalTipo) * 100);
  const pctConv = Math.round((opts.convenioMes / totalTipo) * 100);

  const topRows = opts.topServicos.map((s, i) =>
    `<tr><td>#${i + 1}</td><td>${s.nome ?? "Serviço removido"}</td><td style="text-align:right">${s.total} vez${s.total !== 1 ? "es" : ""}</td></tr>`
  ).join("");

  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatórios</title>
    <style>
      ${BASE_CSS}
      body { max-width: 800px; margin: 0 auto; padding: 28px; }
      .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
      .header h1 { font-size: 20px; margin: 0 0 2px; }
      .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 20px 0 8px; border-top: 1px solid #eee; padding-top: 10px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 4px; }
      .kpi-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 4px; }
      .kpi { border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px 12px; }
      .kpi .label { font-size: 9px; color: #777; margin-bottom: 4px; }
      .kpi .value { font-size: 16px; font-weight: bold; }
      .kpi .sub { font-size: 9px; color: #555; margin-top: 2px; }
      .green { color: #16a34a; }
      .bar-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 10px; }
      .bar-bg { flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 4px; background: #2563eb; }
      .bar-fill-green { height: 100%; border-radius: 4px; background: #16a34a; }
      .bar-label { width: 80px; text-align: right; color: #555; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <div class="header">
      <h1>Relatório Gerencial</h1>
      <div class="sub">${opts.nomeClinica} · Gerado em ${new Date().toLocaleString("pt-BR")}</div>
    </div>

    <div class="section-title">Hoje — ${hoje}</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Consultas Hoje</div><div class="value">${opts.consultasHoje}</div><div class="sub">${opts.particularHoje} part. · ${opts.convenioHoje} conv.</div></div>
      <div class="kpi"><div class="label">Receita Hoje</div><div class="value green">${fmtR(opts.receitaHoje)}</div></div>
      <div class="kpi"><div class="label">Particular Hoje</div><div class="value">${opts.particularHoje}</div><div class="sub">atendimentos</div></div>
      <div class="kpi"><div class="label">Convênio Hoje</div><div class="value">${opts.convenioHoje}</div><div class="sub">atendimentos</div></div>
    </div>

    <div class="section-title">Mês de ${mes}</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Pacientes Ativos</div><div class="value">${opts.totalPacientes}</div></div>
      <div class="kpi"><div class="label">Consultas no Mês</div><div class="value">${opts.totalConsultas}</div><div class="sub">${opts.particularMes} part. · ${opts.convenioMes} conv.</div></div>
      <div class="kpi"><div class="label">Receita do Mês</div><div class="value green">${fmtR(opts.receitaMes)}</div></div>
      <div class="kpi"><div class="label">Taxa de Comparecimento</div><div class="value">${opts.taxaComparecimento}%</div></div>
    </div>

    <div class="section-title">Particular vs Convênio — Mês</div>
    <div style="padding: 4px 0;">
      <div class="bar-row">
        <span style="width:70px">Particular</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${pctPart}%"></div></div>
        <span class="bar-label">${opts.particularMes} atend. (${pctPart}%)</span>
      </div>
      <div class="bar-row">
        <span style="width:70px">Convênio</span>
        <div class="bar-bg"><div class="bar-fill-green" style="width:${pctConv}%"></div></div>
        <span class="bar-label">${opts.convenioMes} atend. (${pctConv}%)</span>
      </div>
    </div>

    ${opts.topServicos.length > 0 ? `
    <div class="section-title">Top Serviços do Mês</div>
    <table><thead><tr><th>#</th><th>Serviço</th><th style="text-align:right">Qtd</th></tr></thead>
    <tbody>${topRows}</tbody></table>` : ""}

    <div class="section-title">Faturamento do Mês</div>
    <div class="kpi-grid-2">
      <div class="kpi"><div class="label">Receita Registrada (Particular)</div><div class="value green" style="font-size:20px">${fmtR(opts.receitaMes)}</div></div>
      <div class="kpi"><div class="label">Taxa de Comparecimento</div><div class="value" style="font-size:20px">${opts.taxaComparecimento}%</div><div class="sub">de ${opts.totalConsultas} consultas agendadas</div></div>
    </div>
  </body></html>`);
}

export function printFinanceiroAgrupado(opts: {
  nomeClinica: string;
  mes: string;
  transacoes: { tipo: string; categoria: string; descricao: string; valor: string; data: string }[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}) {
  const fmtR = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Agrupar por data
  const porDia = new Map<string, typeof opts.transacoes>();
  for (const t of opts.transacoes) {
    if (!porDia.has(t.data)) porDia.set(t.data, []);
    porDia.get(t.data)!.push(t);
  }
  const diasOrdenados = [...porDia.keys()].sort((a, b) => b.localeCompare(a));

  const diasHtml = diasOrdenados.map((dia) => {
    const items = porDia.get(dia)!;
    const receitas = items.filter((t) => t.tipo === "receita");
    const despesas = items.filter((t) => t.tipo === "despesa");
    const totalDia = items.reduce((s, t) => {
      const v = parseFloat(t.valor);
      return t.tipo === "receita" ? s + v : s - v;
    }, 0);

    const linhaReceitas = receitas.map((t) =>
      `<tr><td style="padding-left:16px;color:#16a34a">↑ Receita</td><td>${t.categoria}</td><td>${t.descricao}</td><td style="text-align:right;color:#16a34a;font-weight:500">+ ${fmtR(parseFloat(t.valor))}</td></tr>`
    ).join("");

    const linhaDespesas = despesas.map((t) =>
      `<tr><td style="padding-left:16px;color:#dc2626">↓ Despesa</td><td>${t.categoria}</td><td>${t.descricao}</td><td style="text-align:right;color:#dc2626;font-weight:500">- ${fmtR(parseFloat(t.valor))}</td></tr>`
    ).join("");

    const saldoDia = totalDia >= 0
      ? `<span style="color:#16a34a">+ ${fmtR(totalDia)}</span>`
      : `<span style="color:#dc2626">- ${fmtR(Math.abs(totalDia))}</span>`;

    return `
      <tr style="background:#f4f4f4">
        <td colspan="3" style="font-weight:bold;font-size:11px;padding:7px 8px">
          ${new Date(dia + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </td>
        <td style="text-align:right;padding:7px 8px;font-weight:bold">${saldoDia}</td>
      </tr>
      ${linhaReceitas}${linhaDespesas}`;
  }).join("");

  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Financeiro</title>
    <style>
      ${BASE_CSS}
      body { max-width: 800px; margin: 0 auto; padding: 28px; }
      .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
      .header h1 { font-size: 20px; margin: 0 0 2px; }
      .resumo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
      .resumo-card { border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px 12px; }
      .resumo-card .label { font-size: 9px; color: #777; margin-bottom: 3px; text-transform: uppercase; letter-spacing: .5px; }
      .resumo-card .value { font-size: 17px; font-weight: bold; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <div class="header">
      <h1>Financeiro — Lançamentos do Mês</h1>
      <div class="sub">${opts.nomeClinica} · ${opts.mes} · Gerado em ${new Date().toLocaleString("pt-BR")}</div>
    </div>
    <div class="resumo">
      <div class="resumo-card"><div class="label">Receitas do Mês</div><div class="value" style="color:#16a34a">${fmtR(opts.totalReceitas)}</div></div>
      <div class="resumo-card"><div class="label">Despesas do Mês</div><div class="value" style="color:#dc2626">${fmtR(opts.totalDespesas)}</div></div>
      <div class="resumo-card"><div class="label">Saldo do Mês</div><div class="value" style="color:${opts.saldo >= 0 ? "#16a34a" : "#dc2626"}">${opts.saldo >= 0 ? "" : "- "}${fmtR(Math.abs(opts.saldo))}</div></div>
    </div>
    <table>
      <thead><tr><th>Tipo</th><th>Categoria</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${diasHtml}</tbody>
    </table>
  </body></html>`);
}

export function printTable(title: string, headers: string[], rows: (string | number)[][], info = "") {
  const bodyRows = rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? "-"}</td>`).join("")}</tr>`).join("");
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>${BASE_CSS}</style></head><body>
    <h1>${title}</h1>
    <p class="sub">${info ? info + " · " : ""}Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body></html>`);
}

export function printRecibo(opts: {
  nomePetShop: string;
  paciente: string;
  data: string;
  itens: { descricao: string; profissional: string; valor: number }[];
  desconto: number;
  total: number;
  formaPagamento: string;
}) {
  const sub = opts.itens.reduce((s, i) => s + i.valor, 0);
  const rows = opts.itens
    .map((i) => `<tr><td>${i.descricao}</td><td>${i.profissional}</td><td style="text-align:right">${formatCurrency(i.valor)}</td></tr>`)
    .join("");
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo</title>
    <style>
      ${BASE_CSS}
      .header { display:flex; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #111; }
      .footer { margin-top:48px; border-top:1px solid #ccc; padding-top:10px; font-size:10px; color:#888; text-align:center; }
      .total-line td { font-weight:bold; font-size:13px; }
    </style></head><body>
    <div class="header">
      <div><h1>${opts.nomePetShop}</h1><p class="sub">Recibo de Pagamento</p></div>
      <p class="sub" style="text-align:right">Data: ${new Date(opts.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
    </div>
    <p><strong>Paciente:</strong> ${opts.paciente}</p>
    <table style="margin-top:12px">
      <thead><tr><th>Serviço</th><th>Profissional</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        ${rows}
        <tr style="background:#f9f9f9"><td colspan="2"><strong>Subtotal</strong></td><td style="text-align:right"><strong>${formatCurrency(sub)}</strong></td></tr>
        ${opts.desconto > 0 ? `<tr><td colspan="2">Desconto</td><td style="text-align:right">- ${formatCurrency(opts.desconto)}</td></tr>` : ""}
        <tr class="total-line"><td colspan="2">TOTAL</td><td style="text-align:right">${formatCurrency(opts.total)}</td></tr>
        <tr><td colspan="2">Forma de pagamento</td><td style="text-align:right">${opts.formaPagamento}</td></tr>
      </tbody>
    </table>
    <div class="footer">Obrigado pela preferência!</div>
  </body></html>`);
}

export function printCupom(opts: {
  nomePetShop: string;
  paciente: string;
  data: string;
  itens: { descricao: string; valor: number }[];
  desconto: number;
  total: number;
  formaPagamento: string;
}) {
  const sub = opts.itens.reduce((s, i) => s + i.valor, 0);
  const linhas = opts.itens
    .map((i) => `<div class="row"><span>${i.descricao}</span><span>${formatCurrency(i.valor)}</span></div>`)
    .join("");
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cupom</title>
    <style>
      body { font-family: monospace; font-size:11px; width:300px; margin:0 auto; padding:10px; }
      .c { text-align:center; } .bold { font-weight:bold; }
      .line { border-top:1px dashed #aaa; margin:6px 0; }
      .row { display:flex; justify-content:space-between; margin:2px 0; }
      @media print { body { width:72mm; } }
    </style></head><body>
    <div class="c bold" style="font-size:13px">${opts.nomePetShop}</div>
    <div class="c" style="font-size:9px;color:#555">${new Date(opts.data + "T00:00:00").toLocaleDateString("pt-BR")}</div>
    <div class="line"></div>
    <div><strong>Paciente:</strong> ${opts.paciente}</div>
    <div class="line"></div>
    ${linhas}
    <div class="line"></div>
    <div class="row"><span>Subtotal</span><span>${formatCurrency(sub)}</span></div>
    ${opts.desconto > 0 ? `<div class="row"><span>Desconto</span><span>- ${formatCurrency(opts.desconto)}</span></div>` : ""}
    <div class="row bold"><span>TOTAL</span><span>${formatCurrency(opts.total)}</span></div>
    <div class="row" style="font-size:10px;color:#555"><span>${opts.formaPagamento}</span></div>
    <div class="line"></div>
    <div class="c" style="font-size:9px">Obrigado pela preferência!</div>
  </body></html>`);
}

export function printProntuario(opts: {
  nomeClinica: string;
  medico: string;
  registro: string;
  paciente: string;
  data: string;
  queixaPrincipal?: string;
  historicoClinico?: string;
  exameClinico?: string;
  diagnostico?: string;
  cid?: string;
  conduta?: string;
  retorno?: string;
  observacoes?: string;
}) {
  const campo = (label: string, valor?: string) => valor
    ? `<div class="campo"><div class="label">${label}</div><div>${valor}</div></div>`
    : "";
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prontuário</title>
    <style>
      ${BASE_CSS}
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 30px; max-width: 700px; margin: 0 auto; }
      .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
      .header h1 { font-size: 18px; margin: 0 0 2px; }
      .header .sub { font-size: 11px; color: #555; }
      .campo { margin: 12px 0; }
      .label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: .5px; color: #666; margin-bottom: 3px; }
      .divider { border: none; border-top: 1px solid #eee; margin: 14px 0; }
      .footer-sig { margin-top: 60px; border-top: 1px solid #999; padding-top: 8px; text-align: center; font-size: 11px; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <div class="header">
      <h1>PRONTUÁRIO MÉDICO</h1>
      <div class="sub">${opts.nomeClinica}</div>
    </div>
    <div class="campo"><div class="label">Paciente</div><div><strong>${opts.paciente}</strong></div></div>
    <div class="campo"><div class="label">Data</div><div>${new Date(opts.data + "T00:00:00").toLocaleDateString("pt-BR")}</div></div>
    <hr class="divider">
    ${campo("Queixa Principal", opts.queixaPrincipal)}
    ${campo("Histórico Clínico", opts.historicoClinico)}
    ${campo("Exame Clínico", opts.exameClinico)}
    <hr class="divider">
    ${campo("Diagnóstico", opts.diagnostico)}
    ${campo("CID-10", opts.cid)}
    ${campo("Conduta", opts.conduta)}
    ${campo("Retorno", opts.retorno)}
    ${campo("Observações", opts.observacoes)}
    <div class="footer-sig">
      ___________________________<br>
      ${opts.medico}<br>
      <span style="color:#555;font-size:10px">${opts.registro}</span>
    </div>
  </body></html>`);
}

export function printReceita(opts: {
  nomePetShop: string;
  medico: string;
  registro: string;
  paciente: string;
  data: string;
  medicamentos: Array<{
    nome: string;
    dosagem: string;
    via: string;
    posologia: string;
    duracao: string;
    quantidade: string;
  }>;
  observacoes?: string;
}) {
  const meds = opts.medicamentos.map((m, i) => `
    <div style="margin-bottom:12px">
      <strong>${i + 1}. ${m.nome} ${m.dosagem}</strong><br>
      Via ${m.via} — ${m.posologia}${m.duracao ? " por " + m.duracao : ""}${m.quantidade ? "<br>Qtd: " + m.quantidade : ""}
    </div>`).join("");
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receita Médica</title>
    <style>
      ${BASE_CSS}
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 30px; max-width: 700px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
      .rx-title { font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #1a56db; }
      .info-line { font-size: 11px; color: #555; }
      .section { margin: 16px 0; }
      .footer-sig { margin-top: 60px; border-top: 1px solid #999; padding-top: 8px; text-align: center; font-size: 11px; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <div class="header">
      <div class="rx-title">RECEITA MÉDICA</div>
      <div class="info-line">${opts.nomePetShop}</div>
    </div>
    <div class="section">
      <strong>Paciente:</strong> ${opts.paciente} &nbsp;&nbsp; <strong>Data:</strong> ${new Date(opts.data + "T00:00:00").toLocaleDateString("pt-BR")}
    </div>
    <hr>
    <div class="section"><strong>Rx:</strong><br><br>${meds}</div>
    ${opts.observacoes ? `<div class="section"><strong>Observações:</strong> ${opts.observacoes}</div>` : ""}
    <div class="footer-sig">
      ___________________________<br>
      ${opts.medico}<br>
      <span class="info-line">${opts.registro}</span>
    </div>
  </body></html>`);
}

export function printAtestado(opts: {
  nomePetShop: string;
  cidade: string;
  medico: string;
  registro: string;
  paciente: string;
  cpf?: string;
  tipo: string;
  diasAfastamento: number;
  dataInicio: string;
  dataFim: string;
  cid?: string;
  motivo?: string;
  data: string;
}) {
  const dataFormatada = new Date(opts.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const dIni = new Date(opts.dataInicio + "T00:00:00").toLocaleDateString("pt-BR");
  const dFim = new Date(opts.dataFim + "T00:00:00").toLocaleDateString("pt-BR");
  const diasExt = extenso(opts.diasAfastamento);
  const tipoTexto = opts.tipo === "comparecimento"
    ? `compareceu a esta clínica para consulta médica na data acima`
    : opts.tipo === "escolar"
    ? `encontra-se impossibilitado(a) de frequentar atividades escolares por ${opts.diasAfastamento} (${diasExt}) dia(s), no período de ${dIni} a ${dFim}`
    : `encontra-se sob meus cuidados médicos, necessitando afastamento de suas atividades por ${opts.diasAfastamento} (${diasExt}) dia(s), no período de ${dIni} a ${dFim}`;

  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Atestado Médico</title>
    <style>
      ${BASE_CSS}
      body { font-family: Arial, sans-serif; font-size: 13px; padding: 40px; max-width: 700px; margin: 0 auto; line-height: 1.8; }
      .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 30px; }
      .title { font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #1a56db; }
      .clinic { font-size: 11px; color: #555; }
      .body-text { margin: 24px 0; text-align: justify; }
      .patient-name { font-size: 15px; font-weight: bold; text-transform: uppercase; margin: 12px 0; }
      .cid { margin: 12px 0; font-size: 11px; color: #555; }
      .place-date { margin-top: 40px; }
      .sig { margin-top: 60px; border-top: 1px solid #999; padding-top: 8px; text-align: center; font-size: 11px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div class="title">ATESTADO MÉDICO</div>
      <div class="clinic">${opts.nomePetShop}</div>
    </div>
    <div class="body-text">
      Atesto para os devidos fins que o(a) paciente
      <div class="patient-name">${opts.paciente}${opts.cpf ? " — CPF: " + opts.cpf : ""}</div>
      ${tipoTexto}.
    </div>
    ${opts.cid ? `<div class="cid">CID-10: ${opts.cid}${opts.motivo ? " — " + opts.motivo : ""}</div>` : ""}
    <div class="place-date">${opts.cidade || "Local"}, ${dataFormatada}.</div>
    <div class="sig">
      ___________________________<br>
      ${opts.medico}<br>
      <span style="color:#555">${opts.registro}</span>
    </div>
  </body></html>`);
}
