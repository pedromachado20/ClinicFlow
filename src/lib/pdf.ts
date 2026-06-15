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
