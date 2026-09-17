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
 * Texto que aparece na tela para cada valor de enum, e a cor do selo.
 * Centralizado aqui para a mesma OS nao ser "Em execucao" numa tela e
 * "Executando" na outra.
 */

export type Tom = "cinza" | "azul" | "amarelo" | "verde" | "vermelho" | "roxo" | "laranja";

export const STATUS_OS: Record<StatusOS, { titulo: string; tom: Tom; ajuda: string }> = {
  RECEBIDO: {
    titulo: "Recebido",
    tom: "cinza",
    ajuda: "Veiculo chegou na oficina e ainda nao foi avaliado.",
  },
  AGUARDANDO_APROVACAO: {
    titulo: "Aguardando aprovacao",
    tom: "amarelo",
    ajuda: "Orcamento enviado, esperando o cliente responder.",
  },
  EM_EXECUCAO: {
    titulo: "Em execucao",
    tom: "azul",
    ajuda: "Servico aprovado e sendo feito pelo mecanico.",
  },
  AGUARDANDO_PECA: {
    titulo: "Aguardando peca",
    tom: "laranja",
    ajuda: "Servico parado esperando peca chegar.",
  },
  PRONTO: {
    titulo: "Pronto",
    tom: "verde",
    ajuda: "Servico terminado, avisar o cliente para retirar.",
  },
  ENTREGUE: {
    titulo: "Entregue",
    tom: "roxo",
    ajuda: "Veiculo retirado pelo cliente.",
  },
  CANCELADO: {
    titulo: "Cancelado",
    tom: "vermelho",
    ajuda: "Servico cancelado.",
  },
};

/** Colunas do kanban do patio, na ordem em que aparecem. */
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
  NOVO: { titulo: "Novo contato", tom: "cinza", ajuda: "Chegou agora, ninguem falou ainda." },
  CONTATO_FEITO: { titulo: "Contato feito", tom: "azul", ajuda: "Ja conversamos com a pessoa." },
  ORCAMENTO_ENVIADO: { titulo: "Orcamento enviado", tom: "amarelo", ajuda: "Mandamos o preco." },
  NEGOCIACAO: { titulo: "Negociando", tom: "laranja", ajuda: "Discutindo preco ou prazo." },
  GANHO: { titulo: "Fechado", tom: "verde", ajuda: "Virou cliente." },
  PERDIDO: { titulo: "Perdido", tom: "vermelho", ajuda: "Nao fechou." },
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
  DONO: { titulo: "Dono", ajuda: "Acesso total, incluindo financeiro e usuarios." },
  GERENTE: { titulo: "Gerente", ajuda: "Acesso total, menos exclusao da oficina." },
  ATENDENTE: { titulo: "Atendente", ajuda: "Cadastra clientes, orcamentos e OS." },
  MECANICO: { titulo: "Mecanico", ajuda: "Ve o patio e atualiza o andamento dos servicos." },
};

export const TIPO_PESSOA: Record<TipoPessoa, string> = {
  FISICA: "Pessoa fisica (CPF)",
  JURIDICA: "Empresa (CNPJ)",
};

export const COMBUSTIVEL: Record<Combustivel, string> = {
  FLEX: "Flex",
  GASOLINA: "Gasolina",
  ETANOL: "Etanol",
  DIESEL: "Diesel",
  GNV: "GNV",
  ELETRICO: "Eletrico",
  HIBRIDO: "Hibrido",
};

export const FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  DEBITO: "Cartao de debito",
  CREDITO: "Cartao de credito",
  BOLETO: "Boleto",
  TRANSFERENCIA: "Transferencia",
  OUTRO: "Outro",
};

export const TIPO_LANCAMENTO: Record<TipoLancamento, { titulo: string; tom: Tom }> = {
  RECEITA: { titulo: "Entrada", tom: "verde" },
  DESPESA: { titulo: "Saida", tom: "vermelho" },
};

export const TIPO_MOVIMENTO: Record<TipoMovimento, { titulo: string; tom: Tom }> = {
  ENTRADA: { titulo: "Entrada", tom: "verde" },
  SAIDA: { titulo: "Saida", tom: "vermelho" },
  AJUSTE: { titulo: "Ajuste", tom: "azul" },
};

export const CATEGORIAS_RECEITA = [
  "Servico / OS",
  "Venda de peca",
  "Outros recebimentos",
];

export const CATEGORIAS_DESPESA = [
  "Compra de pecas",
  "Salarios",
  "Aluguel",
  "Agua / Luz / Internet",
  "Ferramentas",
  "Impostos",
  "Marketing",
  "Outras despesas",
];

export const ORIGENS_CRM = [
  "Indicacao",
  "Instagram",
  "Google",
  "WhatsApp",
  "Passou na frente",
  "Cliente antigo",
  "Outro",
];
