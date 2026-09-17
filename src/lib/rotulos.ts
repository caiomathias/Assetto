import {
  Combustivel,
  EtapaCrm,
  FormaPagamento,
  Papel,
  StatusOrcamento,
  StatusOS,
  TipoLancamento,
  TipoMovimento,
  TipoPessoa,
} from "@prisma/client";

/**
 * Texto que aparece na tela para cada valor de enum, é a cor do selo.
 * Centralizado aqui para a mesma OS não ser "Em execução" numa tela e
 * "Executando" na outra.
 */

export type Tom = "cinza" | "azul" | "amarelo" | "verde" | "vermelho" | "roxo" | "laranja";

export const STATUS_OS: Record<StatusOS, { titulo: string; tom: Tom; ajuda: string }> = {
  RECEBIDO: {
    titulo: "Recebido",
    tom: "cinza",
    ajuda: "Veículo chegou na oficina e ainda não foi avaliado.",
  },
  AGUARDANDO_APROVACAO: {
    titulo: "Aguardando aprovação",
    tom: "amarelo",
    ajuda: "Orçamento enviado, esperando o cliente responder.",
  },
  EM_EXECUCAO: {
    titulo: "Em execução",
    tom: "azul",
    ajuda: "Serviço aprovado e sendo feito pelo mecânico.",
  },
  AGUARDANDO_PECA: {
    titulo: "Aguardando peça",
    tom: "laranja",
    ajuda: "Serviço parado esperando peça chegar.",
  },
  PRONTO: {
    titulo: "Pronto",
    tom: "verde",
    ajuda: "Serviço terminado, avisar o cliente para retirar.",
  },
  ENTREGUE: {
    titulo: "Entregue",
    tom: "roxo",
    ajuda: "Veículo retirado pelo cliente.",
  },
  CANCELADO: {
    titulo: "Cancelado",
    tom: "vermelho",
    ajuda: "Serviço cancelado.",
  },
};

/** Colunas do kanban do pátio, na ordem em que aparecem. */
export const COLUNAS_PATIO: StatusOS[] = [
  StatusOS.RECEBIDO,
  StatusOS.AGUARDANDO_APROVACAO,
  StatusOS.EM_EXECUCAO,
  StatusOS.AGUARDANDO_PECA,
  StatusOS.PRONTO,
  StatusOS.ENTREGUE,
];

export const STATUS_ORCAMENTO: Record<StatusOrcamento, { titulo: string; tom: Tom }> = {
  RASCUNHO: { titulo: "Rascunho", tom: "cinza" },
  ENVIADO: { titulo: "Enviado ao cliente", tom: "amarelo" },
  APROVADO: { titulo: "Aprovado", tom: "verde" },
  RECUSADO: { titulo: "Recusado", tom: "vermelho" },
  CONVERTIDO: { titulo: "Virou OS", tom: "roxo" },
};

export const ETAPA_CRM: Record<EtapaCrm, { titulo: string; tom: Tom; ajuda: string }> = {
  NOVO: { titulo: "Novo contato", tom: "cinza", ajuda: "Chegou agora, ninguém falou ainda." },
  CONTATO_FEITO: { titulo: "Contato feito", tom: "azul", ajuda: "Já conversamos com a pessoa." },
  ORCAMENTO_ENVIADO: { titulo: "Orçamento enviado", tom: "amarelo", ajuda: "Mandamos o preço." },
  NEGOCIACAO: { titulo: "Negociando", tom: "laranja", ajuda: "Discutindo preço ou prazo." },
  GANHO: { titulo: "Fechado", tom: "verde", ajuda: "Virou cliente." },
  PERDIDO: { titulo: "Perdido", tom: "vermelho", ajuda: "Não fechou." },
};

export const COLUNAS_CRM: EtapaCrm[] = [
  EtapaCrm.NOVO,
  EtapaCrm.CONTATO_FEITO,
  EtapaCrm.ORCAMENTO_ENVIADO,
  EtapaCrm.NEGOCIACAO,
  EtapaCrm.GANHO,
  EtapaCrm.PERDIDO,
];

export const PAPEL: Record<Papel, { titulo: string; ajuda: string }> = {
  DONO: { titulo: "Dono", ajuda: "Acesso total, incluindo financeiro e usuários." },
  GERENTE: { titulo: "Gerente", ajuda: "Acesso total, menos exclusão da oficina." },
  ATENDENTE: { titulo: "Atendente", ajuda: "Cadastra clientes, orçamentos e OS." },
  MECANICO: { titulo: "Mecânico", ajuda: "Vê o pátio e atualiza o andamento dos serviços." },
};

export const TIPO_PESSOA: Record<TipoPessoa, string> = {
  FISICA: "Pessoa física (CPF)",
  JURIDICA: "Empresa (CNPJ)",
};

export const COMBUSTIVEL: Record<Combustivel, string> = {
  FLEX: "Flex",
  GASOLINA: "Gasolina",
  ETANOL: "Etanol",
  DIESEL: "Diesel",
  GNV: "GNV",
  ELETRICO: "Elétrico",
  HIBRIDO: "Híbrido",
};

export const FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  DEBITO: "Cartão de débito",
  CREDITO: "Cartão de crédito",
  BOLETO: "Boleto",
  TRANSFERENCIA: "Transferência",
  OUTRO: "Outro",
};

export const TIPO_LANCAMENTO: Record<TipoLancamento, { titulo: string; tom: Tom }> = {
  RECEITA: { titulo: "Entrada", tom: "verde" },
  DESPESA: { titulo: "Saída", tom: "vermelho" },
};

export const TIPO_MOVIMENTO: Record<TipoMovimento, { titulo: string; tom: Tom }> = {
  ENTRADA: { titulo: "Entrada", tom: "verde" },
  SAIDA: { titulo: "Saída", tom: "vermelho" },
  AJUSTE: { titulo: "Ajuste", tom: "azul" },
};

export const CATEGORIAS_RECEITA = [
  "Serviço / OS",
  "Venda de peça",
  "Outros recebimentos",
];

export const CATEGORIAS_DESPESA = [
  "Compra de peças",
  "Salários",
  "Aluguel",
  "Água / Luz / Internet",
  "Ferramentas",
  "Impostos",
  "Marketing",
  "Outras despesas",
];

export const ORIGENS_CRM = [
  "Indicação",
  "Instagram",
  "Google",
  "WhatsApp",
  "Passou na frente",
  "Cliente antigo",
  "Outro",
];
