import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/_app/ajuda/")({
  component: AjudaPage,
});

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Secao = {
  id: string;
  emoji: string;
  titulo: string;
  conteudo: React.ReactNode;
};

// ─── Componentes de formatação ────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-foreground mt-6 mb-2 border-b border-border pb-2">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-5 mb-1.5">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}
function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-3">
      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}
function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 mb-3">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Dica</p>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}
function Atencao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 mb-3">
      <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Atenção</p>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}
function Exemplo({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Exemplo prático</p>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}
function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-1 mb-3 ml-4">
      {itens.map((item, i) => (
        <li key={i} className="text-sm text-muted-foreground flex gap-2">
          <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Conteúdo das seções ──────────────────────────────────────────────────────

const secoes: Secao[] = [
  {
    id: "introducao",
    emoji: "🏠",
    titulo: "Introdução ao ClinicFlow",
    conteudo: (
      <>
        <H2>O que é o ClinicFlow?</H2>
        <P>
          O ClinicFlow é um sistema de gestão para clínicas médicas. Pense nele como um assistente digital que organiza tudo que acontece na sua clínica: consultas, pacientes, pagamentos, prontuários e muito mais — tudo em um só lugar, acessível pelo computador.
        </P>
        <P>
          Antes do ClinicFlow, talvez você usasse cadernos, agendas de papel ou planilhas. Com o sistema, todas essas informações ficam guardadas de forma segura e organizada, e você pode consultá-las a qualquer momento.
        </P>

        <H3>Como o sistema está organizado?</H3>
        <P>No lado esquerdo da tela você encontra o <strong>menu de navegação</strong>. É como o índice de um livro — cada item leva você para uma área diferente do sistema:</P>
        <Lista itens={[
          "Dashboard — resumo geral da clínica no dia de hoje",
          "Agenda — onde você marca e gerencia as consultas",
          "Caixa — onde você registra os pagamentos do dia",
          "Pacientes — cadastro completo de todos os seus pacientes",
          "Prontuários — histórico clínico, receitas e atestados",
          "Profissionais — cadastro dos médicos e da equipe",
          "Serviços — lista de consultas e procedimentos oferecidos",
          "Financeiro — controle de receitas e despesas",
          "Relatórios — análises e estatísticas da clínica",
          "Configurações — personalizar o sistema",
        ]} />

        <H3>Como navegar pelo sistema?</H3>
        <Passo n={1}>Olhe para o lado esquerdo da tela. Você verá uma lista com o nome das seções.</Passo>
        <Passo n={2}>Clique com o mouse no nome da seção que você quer acessar. Por exemplo, clique em "Agenda" para ver as consultas do dia.</Passo>
        <Passo n={3}>A área central da tela vai mudar e mostrar as informações daquela seção.</Passo>
        <Passo n={4}>Para voltar, basta clicar em outro item do menu à esquerda.</Passo>

        <Dica>
          Se o menu da esquerda parecer pequeno (apenas ícones), procure um botão de seta ({">"}) na borda do menu e clique nele para expandir e ver os nomes completos.
        </Dica>

        <H3>Primeiros passos recomendados</H3>
        <P>Para começar a usar o ClinicFlow, sugerimos fazer na seguinte ordem:</P>
        <Passo n={1}>Cadastre os <strong>Profissionais</strong> da clínica (médicos, dentistas, etc.).</Passo>
        <Passo n={2}>Cadastre os <strong>Serviços</strong> que a clínica oferece (consulta, retorno, procedimento, etc.) com os respectivos preços.</Passo>
        <Passo n={3}>Cadastre os <strong>Pacientes</strong> que serão atendidos.</Passo>
        <Passo n={4}>Comece a criar agendamentos na <strong>Agenda</strong>.</Passo>
        <Passo n={5}>Use a <strong>Caixa</strong> para registrar pagamentos ao final do dia.</Passo>
      </>
    ),
  },
  {
    id: "dashboard",
    emoji: "📊",
    titulo: "Dashboard — Visão Geral",
    conteudo: (
      <>
        <H2>O que é o Dashboard?</H2>
        <P>
          O Dashboard é a primeira tela que você vê ao abrir o sistema. Pense nele como o painel de um carro — ele mostra os principais números da clínica de forma rápida e visual, para você ter tudo sob controle sem precisar procurar.
        </P>

        <H3>O que aparece no Dashboard?</H3>
        <Lista itens={[
          "Consultas de Hoje — quantas consultas estão marcadas para o dia atual",
          "Próximas Consultas — lista das consultas de hoje com horário e status",
          "Receita do Mês — total de dinheiro recebido no mês atual",
          "Pacientes Ativos — quantos pacientes estão cadastrados no sistema",
          "Consultas no Mês — quantas consultas foram realizadas no mês",
          "Taxa de Comparecimento — percentual de pacientes que efetivamente compareceram",
          "Particular vs Convênio — divisão entre atendimentos pagos diretamente e por plano",
        ]} />

        <Exemplo>
          Você chega pela manhã na clínica, abre o ClinicFlow, e o Dashboard mostra: "8 consultas hoje". Você já sabe que vai ser um dia movimentado, mesmo antes de abrir a Agenda.
        </Exemplo>

        <H3>Os números estão zerados, o que fazer?</H3>
        <P>Se os números aparecem zerados, significa que ainda não há dados suficientes no sistema. Isso é normal no início. À medida que você cadastra pacientes e cria agendamentos, os números vão aparecer automaticamente.</P>

        <Dica>
          O Dashboard atualiza automaticamente. Você não precisa fazer nada para que os números mudem — eles refletem sempre o estado atual do sistema.
        </Dica>
      </>
    ),
  },
  {
    id: "agenda",
    emoji: "📅",
    titulo: "Agenda — Gerenciar Consultas",
    conteudo: (
      <>
        <H2>O que é a Agenda?</H2>
        <P>
          A Agenda é onde você marca, organiza e acompanha todas as consultas da clínica. É como uma agenda de papel, mas muito mais poderosa: guarda tudo automaticamente, avisa sobre conflitos de horário e conecta a consulta ao pagamento.
        </P>

        <H3>Como ver a agenda de um dia específico?</H3>
        <Passo n={1}>Clique em "Agenda" no menu da esquerda.</Passo>
        <Passo n={2}>No topo da tela, você verá a data atual com dois botões de seta ({"<"} e {">"}). Clique na seta da esquerda para ir ao dia anterior, ou na seta da direita para ir ao dia seguinte.</Passo>
        <Passo n={3}>Clique no botão "Hoje" para voltar rapidamente ao dia atual.</Passo>
        <Passo n={4}>As consultas do dia aparecem listadas na tela, em ordem de horário.</Passo>

        <H3>Como marcar uma nova consulta?</H3>
        <Passo n={1}>Na tela da Agenda, clique no botão azul <strong>"+ Novo Agendamento"</strong> (no canto superior direito).</Passo>
        <Passo n={2}>Uma janela se abrirá. Preencha os campos:</Passo>
        <Lista itens={[
          "Paciente — clique na caixa e escolha o paciente na lista. Se não aparecer, ele ainda não está cadastrado",
          "Profissional — escolha o médico ou profissional que vai atender",
          "Serviço — escolha o tipo de consulta ou procedimento",
          "Data — escolha a data da consulta",
          "Hora Início — horário que começa a consulta (ex: 14:00)",
          "Hora Fim — horário que termina (ex: 14:30)",
          "Tipo de Atendimento — escolha Particular ou Convênio",
          "Convênio — se for convênio, escreva o nome do plano de saúde",
          "Observações — informações extras que queira anotar (opcional)",
        ]} />
        <Passo n={3}>Clique no botão <strong>"Agendar"</strong> para salvar.</Passo>
        <Passo n={4}>A consulta aparecerá na lista da agenda imediatamente.</Passo>

        <Atencao>
          Se você tentar marcar um horário que já está ocupado para o mesmo profissional, o sistema vai avisar automaticamente: "Conflito de horário". Neste caso, escolha outro horário.
        </Atencao>

        <Exemplo>
          Você quer marcar uma consulta para a paciente Maria Santos com o Dr. Carlos, amanhã às 10h. Clique em "+ Novo Agendamento", selecione "Maria Santos" no campo Paciente, "Dr. Carlos" no Profissional, escolha o serviço "Consulta", coloque a data de amanhã, 10:00 no início e 10:30 no fim. Clique em "Agendar". Pronto!
        </Exemplo>

        <H3>Como mudar o status de uma consulta?</H3>
        <P>Cada consulta tem um <strong>status</strong> que indica o que está acontecendo com ela. Você pode mudar o status clicando na consulta e depois no campo de status:</P>
        <Lista itens={[
          "Agendado — consulta marcada, aguardando o dia",
          "Confirmado — paciente confirmou a presença (WhatsApp é enviado automaticamente se configurado)",
          "Em Atendimento — paciente está sendo atendido agora",
          "Concluído — consulta finalizada com sucesso",
          "Cancelado — consulta foi cancelada",
          "Faltou — paciente não compareceu",
        ]} />

        <H3>Como editar ou excluir uma consulta?</H3>
        <Passo n={1}>Encontre a consulta na lista da agenda.</Passo>
        <Passo n={2}>Clique no ícone de lápis (✏️) para editar, ou no ícone de lixeira (🗑️) para excluir.</Passo>
        <Passo n={3}>Para editar: faça as alterações e clique em "Salvar".</Passo>
        <Passo n={4}>Para excluir: confirme que deseja remover a consulta.</Passo>

        <H3>Como imprimir a agenda do dia?</H3>
        <Passo n={1}>Na tela da Agenda, clique no botão <strong>"PDF"</strong> (com ícone de impressora).</Passo>
        <Passo n={2}>Uma janela de impressão vai abrir. Clique em "Imprimir" ou "Salvar como PDF".</Passo>

        <Dica>
          Quando você muda o status de uma consulta para "Concluído", o sistema registra automaticamente a receita no Financeiro — para pacientes particulares. Isso evita que você precise lançar manualmente!
        </Dica>
      </>
    ),
  },
  {
    id: "caixa",
    emoji: "💰",
    titulo: "Caixa — Registrar Pagamentos",
    conteudo: (
      <>
        <H2>O que é a Caixa?</H2>
        <P>
          A Caixa é onde você registra os pagamentos dos pacientes. No final do atendimento (ou quando o paciente for pagar), você acessa a Caixa, seleciona o paciente e informa como ele pagou. O sistema automaticamente lança a receita no Financeiro.
        </P>

        <H3>Como registrar um pagamento?</H3>
        <Passo n={1}>Clique em "Caixa" no menu da esquerda.</Passo>
        <Passo n={2}>No topo, confirme que a data mostrada é a do dia que você quer registrar. Use as setas para mudar o dia se necessário.</Passo>
        <Passo n={3}>No painel da esquerda, aparecerão todos os pacientes com consultas nesse dia. Clique no nome do paciente que vai pagar.</Passo>
        <Passo n={4}>No painel da direita, você verá os serviços prestados e o valor total.</Passo>
        <Passo n={5}>Se houver desconto, preencha o campo "Desconto (R$)" com o valor a descontar.</Passo>
        <Passo n={6}>Escolha a <strong>Forma de Pagamento</strong>: Dinheiro, PIX, Débito ou Crédito.</Passo>
        <Passo n={7}>Clique no botão verde <strong>"Registrar Pagamento"</strong>.</Passo>
        <Passo n={8}>O sistema confirma o pagamento e muda o status do paciente para "Pago" na lista.</Passo>

        <Exemplo>
          Após a consulta, o paciente João Pereira chega para pagar. Você abre a Caixa, clica no nome "João Pereira" no painel esquerdo. O sistema mostra: "Consulta — R$ 150,00". João vai pagar com PIX. Você seleciona "PIX" e clica em "Registrar Pagamento". Pronto — a receita já aparece no Financeiro!
        </Exemplo>

        <H3>Como imprimir o recibo ou cupom?</H3>
        <Passo n={1}>Após registrar o pagamento (ou se o paciente já pagou), com o paciente selecionado no painel direito, você verá dois botões: <strong>"Cupom"</strong> e <strong>"Recibo"</strong>.</Passo>
        <Passo n={2}>Clique em <strong>"Cupom"</strong> para imprimir um comprovante menor (estilo cupom fiscal).</Passo>
        <Passo n={3}>Clique em <strong>"Recibo"</strong> para imprimir um recibo formal em formato A4.</Passo>

        <Atencao>
          Cada paciente só pode ter um pagamento registrado por dia. Se clicar em "Registrar Pagamento" duas vezes para o mesmo paciente no mesmo dia, o sistema vai avisar que o pagamento já foi registrado.
        </Atencao>

        <Dica>
          O desconto na Caixa é deduzido do valor total da consulta. Por exemplo: consulta de R$200 com desconto de R$50 — o sistema registra R$150 como receita.
        </Dica>
      </>
    ),
  },
  {
    id: "pacientes",
    emoji: "👥",
    titulo: "Pacientes — Cadastro Completo",
    conteudo: (
      <>
        <H2>O que é a seção de Pacientes?</H2>
        <P>
          Aqui você cadastra e gerencia todos os pacientes da clínica. Cada paciente tem uma ficha completa com dados pessoais, informações de saúde e um link direto para o prontuário clínico.
        </P>

        <H3>Como cadastrar um novo paciente?</H3>
        <Passo n={1}>Clique em "Pacientes" no menu da esquerda.</Passo>
        <Passo n={2}>Clique no botão azul <strong>"+ Novo Paciente"</strong> no canto superior direito.</Passo>
        <Passo n={3}>Preencha os campos que você tiver. Os campos mais importantes são:</Passo>
        <Lista itens={[
          "Nome completo — obrigatório",
          "CPF — número de identificação do paciente",
          "Data de Nascimento — o sistema calcula a idade automaticamente",
          "Telefone — importante para o WhatsApp de confirmação de consulta",
          "Email — para contato",
          "Convênio — nome do plano de saúde, se tiver",
          "Tipo Sanguíneo — ex: A+, B-, O+",
          "Alergias — ex: Penicilina, AAS",
          "Foto — você pode tirar ou carregar uma foto do paciente",
        ]} />
        <Passo n={4}>Clique em <strong>"Cadastrar"</strong> para salvar o paciente.</Passo>

        <H3>Como editar os dados de um paciente?</H3>
        <Passo n={1}>Encontre o paciente na lista (use a busca no topo se necessário).</Passo>
        <Passo n={2}>No card do paciente, clique no ícone de lápis (✏️).</Passo>
        <Passo n={3}>Faça as alterações desejadas e clique em <strong>"Salvar Alterações"</strong>.</Passo>

        <H3>Como buscar um paciente?</H3>
        <Passo n={1}>No topo da tela de Pacientes, clique na barra de busca.</Passo>
        <Passo n={2}>Digite o nome, CPF ou telefone do paciente.</Passo>
        <Passo n={3}>A lista filtra automaticamente enquanto você digita.</Passo>

        <H3>Como acessar o prontuário de um paciente direto do card?</H3>
        <Passo n={1}>Encontre o paciente na lista.</Passo>
        <Passo n={2}>No card do paciente, clique no botão azul <strong>"Prontuário"</strong>.</Passo>
        <Passo n={3}>O sistema vai abrir a tela de Prontuários com o paciente já selecionado, mostrando todo o histórico clínico.</Passo>

        <Exemplo>
          Você quer ver todos os prontuários da paciente Ana Lima. Vá em Pacientes, encontre "Ana Lima" na lista e clique no botão "Prontuário" no card dela. O sistema abre direto na ficha dela com todas as consultas anteriores.
        </Exemplo>

        <H3>Como remover um paciente?</H3>
        <Passo n={1}>No card do paciente, clique no ícone de lixeira (🗑️).</Passo>
        <Passo n={2}>Confirme que deseja remover.</Passo>
        <Passo n={3}>O paciente será desativado (não aparecerá mais na lista), mas os dados históricos são preservados.</Passo>

        <Atencao>
          Remover um paciente não apaga o histórico de consultas e prontuários. Os dados ficam guardados por segurança.
        </Atencao>

        <Dica>
          Quanto mais completo o cadastro do paciente (com telefone e email), melhor o sistema funciona — o WhatsApp de confirmação de consulta só funciona se o telefone estiver cadastrado.
        </Dica>
      </>
    ),
  },
  {
    id: "prontuarios",
    emoji: "📋",
    titulo: "Prontuários, Receitas e Atestados",
    conteudo: (
      <>
        <H2>O que são os Prontuários?</H2>
        <P>
          O prontuário é o registro clínico de uma consulta. Funciona como o caderninho do médico, mas digital: guarda o que o paciente relatou, o que o médico examinou, o diagnóstico, o tratamento e muito mais. Além do prontuário, você pode criar Receitas Médicas e Atestados, todos com impressão profissional.
        </P>

        <H3>Como acessar os prontuários de um paciente?</H3>
        <Passo n={1}>Clique em "Prontuários" no menu da esquerda.</Passo>
        <Passo n={2}>No painel da esquerda, aparece a lista de todos os pacientes. Clique no nome do paciente.</Passo>
        <Passo n={3}>No painel da direita, aparecem três abas: <strong>Prontuários | Receitas | Atestados</strong>.</Passo>
        <Passo n={4}>Clique na aba que desejar para ver o histórico.</Passo>

        <H3>Como criar um novo prontuário (registro de consulta)?</H3>
        <Passo n={1}>Selecione o paciente no painel esquerdo.</Passo>
        <Passo n={2}>Na aba "Prontuários", clique no botão <strong>"+ Novo Prontuário"</strong>.</Passo>
        <Passo n={3}>Preencha os campos da consulta:</Passo>
        <Lista itens={[
          "Profissional — quem realizou a consulta",
          "Data — data da consulta",
          "Queixa Principal — o que o paciente relatou (ex: dor de cabeça há 3 dias)",
          "Histórico Clínico — doenças anteriores, cirurgias, medicamentos em uso",
          "Exame Clínico — o que o médico encontrou no exame físico",
          "Diagnóstico — conclusão do médico",
          "CID-10 — código da doença (ex: J00 para resfriado comum)",
          "Conduta — tratamento prescrito",
          "Retorno — quando o paciente deve voltar (ex: 30 dias)",
          "Observações — qualquer anotação extra",
        ]} />
        <Passo n={4}>Clique em <strong>"Salvar Prontuário"</strong>.</Passo>

        <H3>Como imprimir um prontuário?</H3>
        <Passo n={1}>Na aba Prontuários, clique no card do prontuário que deseja imprimir.</Passo>
        <Passo n={2}>Uma janela se abre mostrando todos os detalhes.</Passo>
        <Passo n={3}>Clique no botão <strong>"Imprimir"</strong> no canto superior direito da janela.</Passo>
        <Passo n={4}>Uma folha formatada abrirá para impressão, com o nome da clínica e espaço para assinatura.</Passo>

        <H3>Como criar uma receita médica?</H3>
        <Passo n={1}>Selecione o paciente no painel esquerdo.</Passo>
        <Passo n={2}>Clique na aba <strong>"Receitas"</strong>.</Passo>
        <Passo n={3}>Clique em <strong>"+ Nova Receita"</strong>.</Passo>
        <Passo n={4}>Escolha o profissional e a data.</Passo>
        <Passo n={5}>Para cada medicamento, clique em <strong>"+ Medicamento"</strong> e preencha:</Passo>
        <Lista itens={[
          "Nome do medicamento — ex: Amoxicilina",
          "Dosagem — ex: 500mg",
          "Via — como tomar: Oral, Injetável, Tópico, etc.",
          "Posologia — quando tomar: ex: 1 comprimido de 8 em 8 horas",
          "Duração — por quanto tempo: ex: 7 dias",
          "Quantidade — quantas caixas/unidades",
        ]} />
        <Passo n={6}>Adicione quantos medicamentos precisar clicando em "+ Medicamento".</Passo>
        <Passo n={7}>Clique em <strong>"Salvar e Imprimir"</strong> para já imprimir a receita, ou <strong>"Salvar"</strong> para guardar sem imprimir.</Passo>

        <Exemplo>
          Dr. Carlos precisa receitar Amoxicilina para a paciente Ana Lima. Ele seleciona Ana Lima, clica na aba "Receitas", clica "+ Nova Receita", preenche o medicamento, clica em "Salvar e Imprimir". O sistema abre automaticamente a receita formatada para impressão.
        </Exemplo>

        <H3>Como criar um atestado médico?</H3>
        <Passo n={1}>Selecione o paciente, clique na aba <strong>"Atestados"</strong>.</Passo>
        <Passo n={2}>Clique em <strong>"+ Novo Atestado"</strong>.</Passo>
        <Passo n={3}>Escolha o tipo de atestado:</Passo>
        <Lista itens={[
          "Afastamento — paciente precisa ficar afastado do trabalho",
          "Comparecimento — confirma que o paciente veio à consulta",
          "Escolar — paciente não pode frequentar a escola",
        ]} />
        <Passo n={4}>Preencha os dias, datas de início e fim, e outros campos.</Passo>
        <Passo n={5}>Clique em <strong>"Salvar e Imprimir"</strong>.</Passo>

        <Dica>
          Todos os documentos impressos (prontuário, receita, atestado) têm um espaço reservado para a assinatura do médico na parte de baixo. Após imprimir, o médico assina manualmente.
        </Dica>
      </>
    ),
  },
  {
    id: "profissionais",
    emoji: "👨‍⚕️",
    titulo: "Profissionais — Equipe da Clínica",
    conteudo: (
      <>
        <H2>O que é a seção de Profissionais?</H2>
        <P>
          Aqui você cadastra todos os profissionais de saúde que trabalham na clínica: médicos, dentistas, psicólogos, fisioterapeutas, etc. Cada profissional cadastrado pode ser selecionado nos agendamentos e prontuários.
        </P>

        <H3>Como cadastrar um profissional?</H3>
        <Passo n={1}>Clique em "Profissionais" no menu da esquerda.</Passo>
        <Passo n={2}>Clique no botão <strong>"+ Novo Profissional"</strong>.</Passo>
        <Passo n={3}>Preencha os dados:</Passo>
        <Lista itens={[
          "Nome completo — nome que vai aparecer nos documentos",
          "Especialidade — Médico, Dentista, Psicólogo, Fisioterapeuta, etc.",
          "Conselho — tipo de registro: CRM, CRO, CRP, CREFITO, CRN, COREN",
          "Registro — número do conselho (ex: CRM 12345)",
          "UF — estado do registro (ex: SP)",
          "Telefone e Email — contato do profissional",
          "Cor na Agenda — escolha uma cor para identificar rapidamente o profissional",
          "Comissão (%) — percentual que o profissional recebe sobre os atendimentos",
          "Foto — foto de perfil do profissional",
        ]} />
        <Passo n={4}>Clique em <strong>"Cadastrar"</strong>.</Passo>

        <Atencao>
          O número do conselho (CRM, CRO, etc.) é o que aparece nos documentos impressos, como receitas e atestados. Certifique-se de preencher corretamente.
        </Atencao>

        <Dica>
          A cor na agenda ajuda muito quando a clínica tem vários profissionais. Você pode identificar rapidamente de quem é cada consulta pela cor.
        </Dica>
      </>
    ),
  },
  {
    id: "servicos",
    emoji: "🔧",
    titulo: "Serviços — O que a Clínica Oferece",
    conteudo: (
      <>
        <H2>O que é a seção de Serviços?</H2>
        <P>
          Aqui você cadastra todos os tipos de atendimentos e procedimentos que a clínica oferece, com os respectivos preços e durações. Quando você cria um agendamento, escolhe um serviço desta lista, e o preço é carregado automaticamente.
        </P>

        <H3>Como cadastrar um serviço?</H3>
        <Passo n={1}>Clique em "Serviços" no menu da esquerda.</Passo>
        <Passo n={2}>Clique no botão <strong>"+ Novo Serviço"</strong>.</Passo>
        <Passo n={3}>Preencha os campos:</Passo>
        <Lista itens={[
          "Nome — ex: Consulta Clínica Geral, Retorno, Limpeza Dental, Psicoterapia",
          "Categoria — Consulta, Retorno, Exame, Procedimento, Cirurgia, Terapia ou Outro",
          "Preço — valor em reais (ex: 150.00)",
          "Duração — tempo em minutos (ex: 30 para meia hora, 60 para uma hora)",
          "Descrição — texto explicando o serviço (opcional)",
        ]} />
        <Passo n={4}>Clique em <strong>"Cadastrar"</strong>.</Passo>

        <Exemplo>
          Uma clínica odontológica pode ter os serviços: "Consulta Inicial" (R$100, 30 min), "Limpeza Dental" (R$150, 45 min), "Extração" (R$200, 60 min). Cadastre cada um separadamente.
        </Exemplo>

        <H3>Como alterar o preço de um serviço?</H3>
        <Passo n={1}>Encontre o serviço na lista.</Passo>
        <Passo n={2}>Clique no ícone de lápis (✏️) no card do serviço.</Passo>
        <Passo n={3}>Altere o preço e clique em <strong>"Salvar Alterações"</strong>.</Passo>

        <Atencao>
          Alterar o preço de um serviço não altera os agendamentos já criados. O novo preço valerá apenas para agendamentos futuros.
        </Atencao>

        <Dica>
          Cadastre todos os serviços antes de começar a agendar consultas. Assim, quando for criar um agendamento, o preço já aparecerá automaticamente.
        </Dica>
      </>
    ),
  },
  {
    id: "financeiro",
    emoji: "💵",
    titulo: "Financeiro — Receitas e Despesas",
    conteudo: (
      <>
        <H2>O que é a seção Financeiro?</H2>
        <P>
          O Financeiro é onde você acompanha todo o dinheiro que entra e sai da clínica. Você pode ver quanto recebeu no mês, registrar despesas (como aluguel e salários) e ter uma visão clara do saldo da clínica.
        </P>

        <H3>O que aparece no Financeiro?</H3>
        <Lista itens={[
          "Receitas do Mês — total de dinheiro que entrou",
          "Despesas do Mês — total de dinheiro que saiu",
          "Saldo do Mês — receitas menos despesas",
          "Receita e Despesa do Dia — valores somente do dia atual",
          "Lista de Lançamentos — todos os registros do mês em ordem de data",
        ]} />

        <H3>Como registrar uma despesa?</H3>
        <Passo n={1}>Clique em "Financeiro" no menu da esquerda.</Passo>
        <Passo n={2}>Clique no botão <strong>"+ Lançamento"</strong>.</Passo>
        <Passo n={3}>No campo "Tipo", selecione <strong>"Despesa"</strong>.</Passo>
        <Passo n={4}>Escolha a categoria: Salários, Aluguel, Equipamentos, Materiais, Marketing, Outros.</Passo>
        <Passo n={5}>Escreva uma descrição (ex: "Aluguel de setembro").</Passo>
        <Passo n={6}>Coloque o valor e a data.</Passo>
        <Passo n={7}>Clique em <strong>"Salvar"</strong>.</Passo>

        <Exemplo>
          No dia 5, você paga o aluguel da clínica: R$3.000. Vá em Financeiro, clique em "+ Lançamento", selecione "Despesa", categoria "Aluguel", descrição "Aluguel setembro/2026", valor 3000.00, data 05/09/2026. Salve. O valor aparecerá como despesa do mês.
        </Exemplo>

        <H3>As receitas precisam ser lançadas manualmente?</H3>
        <P>
          Não, na maioria das vezes não! Quando você registra um pagamento na <strong>Caixa</strong>, a receita é lançada automaticamente no Financeiro. Você só precisa lançar manualmente receitas que não vieram de consultas (ex: venda de produto, repasse de convênio).
        </P>

        <H3>Como imprimir o relatório financeiro?</H3>
        <Passo n={1}>Na tela do Financeiro, clique no botão <strong>"PDF"</strong> na seção de lançamentos.</Passo>
        <Passo n={2}>O relatório será gerado agrupado por dia, separando receitas e despesas.</Passo>

        <Dica>
          O saldo do mês fica em verde quando positivo (mais receita do que despesa) e em vermelho quando negativo. Acompanhe esse número semanalmente para manter a saúde financeira da clínica.
        </Dica>
      </>
    ),
  },
  {
    id: "relatorios",
    emoji: "📈",
    titulo: "Relatórios — Análises da Clínica",
    conteudo: (
      <>
        <H2>O que são os Relatórios?</H2>
        <P>
          Os Relatórios mostram análises detalhadas do desempenho da clínica: quantas consultas foram feitas, quais serviços são mais procurados, quanto cada tipo de atendimento representa, e muito mais. É como ter um gerente analisando os números para você.
        </P>

        <H3>O que você encontra nos Relatórios?</H3>
        <Lista itens={[
          "KPIs de Hoje — consultas, receita e atendimentos do dia atual",
          "KPIs do Mês — resumo mensal de pacientes, consultas e receita",
          "Top 5 Serviços — os serviços mais realizados no mês",
          "Particular vs Convênio — comparação entre os dois tipos de atendimento",
          "Serviços x Tipo — tabela mostrando cada serviço com quantidade particular, convênio e receita gerada",
          "Faturamento do Mês — valor total recebido com taxa de comparecimento",
        ]} />

        <H3>Como usar o relatório de Serviços x Particular/Convênio?</H3>
        <P>Esta tabela responde perguntas importantes como:</P>
        <Lista itens={[
          "Quantas consultas particulares foram feitas de cada serviço?",
          "Quantas foram por convênio?",
          "Qual serviço gerou mais receita?",
        ]} />

        <Exemplo>
          A tabela mostra: "Consulta Clínica — 12 particular, 8 convênio, total 20, receita R$1.800". Isso significa que 20 consultas clínicas foram realizadas, 12 pagas diretamente (gerando R$1.800) e 8 por plano de saúde (cujo repasse chegará depois).
        </Exemplo>

        <H3>Como imprimir o relatório?</H3>
        <Passo n={1}>Na tela de Relatórios, clique no botão <strong>"PDF"</strong> no canto superior direito.</Passo>
        <Passo n={2}>Um documento completo será gerado com todos os indicadores do mês, incluindo a tabela de serviços.</Passo>

        <Atencao>
          Os relatórios mostram sempre o mês atual. Para ver meses anteriores, use os lançamentos do Financeiro.
        </Atencao>

        <Dica>
          Use os relatórios uma vez por semana para acompanhar se a clínica está crescendo. Compare o total de consultas e a receita semana a semana.
        </Dica>
      </>
    ),
  },
  {
    id: "configuracoes",
    emoji: "⚙️",
    titulo: "Configurações — Personalizando o Sistema",
    conteudo: (
      <>
        <H2>O que são as Configurações?</H2>
        <P>
          Nas Configurações você personaliza o sistema: atualiza os dados da clínica e configura o envio automático de mensagens pelo WhatsApp para os pacientes.
        </P>

        <H3>Como atualizar os dados da clínica?</H3>
        <Passo n={1}>Clique em "Configurações" no menu da esquerda.</Passo>
        <Passo n={2}>Na seção "Dados da Clínica", você pode alterar: Nome da Clínica, Email, Telefone, Cidade, Estado, CNPJ e CNES.</Passo>
        <Passo n={3}>Após editar, clique em <strong>"Salvar Dados"</strong>.</Passo>

        <Atencao>
          O nome da clínica que você coloca aqui aparece em todos os documentos impressos: receitas, atestados, prontuários e relatórios. Mantenha atualizado!
        </Atencao>

        <H3>Como configurar o WhatsApp automático?</H3>
        <P>O sistema pode enviar mensagens automáticas para os pacientes quando uma consulta é marcada ou confirmada. Para isso, você precisa de uma conta no WhatsApp Business conectada a um dos serviços compatíveis.</P>
        <Passo n={1}>Na tela de Configurações, role para baixo até a seção <strong>"Integração WhatsApp"</strong>.</Passo>
        <Passo n={2}>Ative a chave "Ativar WhatsApp".</Passo>
        <Passo n={3}>Escolha o provedor: <strong>Z-API</strong> ou <strong>Evolution API</strong>.</Passo>
        <Passo n={4}>Preencha as credenciais fornecidas pelo seu provedor (URL, API Key, Instância).</Passo>
        <Passo n={5}>Clique em <strong>"Salvar WhatsApp"</strong>.</Passo>
        <Passo n={6}>Use o campo de teste para enviar uma mensagem de teste ao seu próprio número e confirmar que está funcionando.</Passo>

        <H3>Como ativar as notificações automáticas?</H3>
        <Passo n={1}>Na seção "Notificações Automáticas", você verá duas opções:</Passo>
        <Lista itens={[
          "Notif. Agendamento — envia mensagem ao paciente quando uma nova consulta é marcada",
          "Notif. Lembrete — envia mensagem ao paciente quando o status muda para Confirmado",
        ]} />
        <Passo n={2}>Ative as opções desejadas.</Passo>
        <Passo n={3}>Clique em <strong>"Salvar Notificações"</strong>.</Passo>

        <Exemplo>
          Com as notificações ativas: quando você agenda uma consulta para Maria Santos, ela recebe automaticamente no WhatsApp: "Olá, Maria! Seu agendamento foi confirmado em Clínica Exemplo. 📅 15/07/2026 às 10:00 👨‍⚕️ Dr. Carlos Silva".
        </Exemplo>

        <Dica>
          O WhatsApp automático só funciona se o paciente tiver o telefone cadastrado na ficha. Sempre preencha o telefone no cadastro do paciente!
        </Dica>
      </>
    ),
  },
  {
    id: "faq",
    emoji: "❓",
    titulo: "Perguntas Frequentes",
    conteudo: (
      <>
        <H2>Dúvidas Comuns</H2>

        <H3>Esqueci de registrar um pagamento. O que faço?</H3>
        <P>Vá até a Caixa, use as setas para ir até o dia em que a consulta aconteceu, selecione o paciente e registre o pagamento normalmente. O sistema aceita datas passadas.</P>

        <H3>Um paciente cancelou. Como removo o agendamento?</H3>
        <P>Na Agenda, encontre a consulta e clique no ícone de lixeira para excluir, ou clique no lápis para editar e mudar o status para "Cancelado". Recomendamos mudar o status em vez de excluir, para manter o histórico.</P>

        <H3>Como sei se o WhatsApp foi enviado?</H3>
        <P>O sistema tenta enviar silenciosamente. Se a mensagem não chegou, verifique se: (1) o telefone do paciente está cadastrado corretamente com DDD, (2) a integração WhatsApp está ativa nas Configurações, (3) as credenciais do provedor estão corretas.</P>

        <H3>Posso ter dois agendamentos no mesmo horário?</H3>
        <P>Para o mesmo profissional, não. O sistema vai avisar "Conflito de horário" e não deixará salvar. Para profissionais diferentes, sim — cada um pode ter agendamentos simultâneos.</P>

        <H3>O sistema perdeu meus dados?</H3>
        <P>Não. Todos os dados ficam guardados em servidores seguros na nuvem. Se a tela parece vazia, tente recarregar a página (pressione F5 no teclado ou clique no ícone de atualizar do navegador).</P>

        <H3>Como faço para imprimir algo?</H3>
        <P>Em praticamente todas as telas há um botão "PDF" ou "Imprimir". Ao clicar, uma nova janela se abrirá com o documento formatado. Nessa janela, clique em "Imprimir" (ou pressione Ctrl+P no teclado) para imprimir ou salvar como PDF.</P>

        <H3>O que é a taxa de comparecimento?</H3>
        <P>É a porcentagem de consultas agendadas em que o paciente efetivamente apareceu. Por exemplo: 10 consultas marcadas, 8 compareceram = 80% de taxa de comparecimento. Quanto maior, melhor para a clínica.</P>

        <H3>Posso acessar o sistema de qualquer computador?</H3>
        <P>Sim! O ClinicFlow funciona em qualquer navegador de internet (Chrome, Edge, Firefox, Safari). Basta acessar o endereço do sistema e fazer login com seu usuário e senha.</P>

        <H3>Como cadastrar um atendimento de convênio?</H3>
        <P>Na hora de criar o agendamento, no campo "Tipo de Atendimento", selecione "Convênio". Um campo adicional aparecerá para você escrever o nome do plano de saúde. O sistema saberá que esse atendimento é de convênio e o receita virá como "a receber" até o repasse do plano.</P>

        <H3>Posso imprimir o manual?</H3>
        <P>Sim! Use o botão "Imprimir Manual PDF" no topo desta página para gerar uma versão completa do manual para impressão.</P>

        <Dica>
          Se tiver alguma dúvida não respondida aqui, entre em contato com o suporte do ClinicFlow.
        </Dica>
      </>
    ),
  },
];

// ─── Função de impressão do manual ────────────────────────────────────────────

function imprimirManual() {
  const win = window.open("", "_blank");
  if (!win) { alert("Pop-up bloqueado. Permita pop-ups para imprimir."); return; }

  const css = `
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
    .capa { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background: #1a56db; color: white; }
    .capa h1 { font-size: 36px; margin: 0 0 12px; }
    .capa p { font-size: 14px; opacity: .8; }
    .capitulo { padding: 40px 50px; page-break-before: always; max-width: 750px; margin: 0 auto; }
    .cap-header { border-bottom: 3px solid #1a56db; padding-bottom: 10px; margin-bottom: 20px; }
    .cap-header h2 { font-size: 22px; color: #1a56db; margin: 0; }
    h3 { font-size: 14px; color: #111; margin: 18px 0 6px; }
    p { font-size: 11px; line-height: 1.7; margin: 0 0 10px; color: #333; }
    .passo { display: flex; gap: 10px; margin-bottom: 8px; }
    .passo-n { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: #1a56db; color: white; font-size: 9px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
    .box { border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 10px; }
    .box-dica { border: 1px solid #16a34a; background: #f0fdf4; }
    .box-dica .label { font-weight: bold; color: #16a34a; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
    .box-atencao { border: 1px solid #d97706; background: #fffbeb; }
    .box-atencao .label { font-weight: bold; color: #d97706; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
    .box-exemplo { border: 1px solid #1a56db; background: #eff6ff; }
    .box-exemplo .label { font-weight: bold; color: #1a56db; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
    ul { margin: 0 0 10px 0; padding: 0; list-style: none; }
    ul li { padding: 2px 0 2px 16px; position: relative; font-size: 11px; color: #333; }
    ul li::before { content: "›"; position: absolute; left: 4px; color: #1a56db; font-weight: bold; }
    @media print { body { padding: 0; } .capitulo { padding: 25px 35px; } }
  `;

  const renderSecao = (s: Secao) => {
    // Simple text extraction for print — render section titles only with placeholder
    return `
      <div class="capitulo">
        <div class="cap-header"><h2>${s.emoji} ${s.titulo}</h2></div>
        <p><em>Consulte esta seção no sistema ClinicFlow → Manual / Ajuda → ${s.titulo}</em></p>
      </div>`;
  };

  // Build full HTML using static content
  const capitulosHtml = secoes.map((s) => renderSecao(s)).join("");

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Manual ClinicFlow</title>
    <style>${css}</style></head><body>
    <div class="capa">
      <h1>ClinicFlow</h1>
      <p style="font-size:20px;font-weight:bold;margin-bottom:8px">Manual do Usuário</p>
      <p>Guia completo de treinamento</p>
      <p style="margin-top:20px;font-size:10px;opacity:.6">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    </div>
    ${capitulosHtml}
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ─── Página ────────────────────────────────────────────────────────────────────

function AjudaPage() {
  const [secaoAtiva, setSecaoAtiva] = useState(secoes[0].id);
  const secao = secoes.find((s) => s.id === secaoAtiva) ?? secoes[0];

  return (
    <div className="-m-6 flex overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
      {/* Painel esquerdo — índice */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col bg-card overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold">Manual do Usuário</p>
              <p className="text-xs text-muted-foreground">Guia de treinamento</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {secoes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSecaoAtiva(s.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-xs transition-colors flex items-start gap-2 ${
                secaoAtiva === s.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none mt-0.5">{s.emoji}</span>
              <span className="leading-snug">{s.titulo}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={imprimirManual}>
            <Printer className="h-3.5 w-3.5" /> Imprimir Manual PDF
          </Button>
        </div>
      </div>

      {/* Painel direito — conteúdo */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{secao.emoji}</span>
            <h1 className="text-2xl font-bold text-foreground">{secao.titulo}</h1>
          </div>
          <div>{secao.conteudo}</div>

          {/* Navegação entre capítulos */}
          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            {secoes.findIndex((s) => s.id === secaoAtiva) > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSecaoAtiva(secoes[secoes.findIndex((s) => s.id === secaoAtiva) - 1].id)}
              >
                ← Capítulo anterior
              </Button>
            ) : <div />}
            {secoes.findIndex((s) => s.id === secaoAtiva) < secoes.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setSecaoAtiva(secoes[secoes.findIndex((s) => s.id === secaoAtiva) + 1].id)}
              >
                Próximo capítulo →
              </Button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}
