import { z } from "zod";

/**
 * Itens chegam do navegador como JSON num campo escondido (ver
 * components/editor-itens.tsx). Aqui eles são validados e os totais
 * recalculados NO SERVIDOR - o valor que o cliente digitou na tela nunca é
 * usado como verdade.
 */
const itemSchema = z.object({
  tipo: z.enum(["PECA", "SERVICO"]),
  pecaId: z.string().nullable().optional(),
  servicoId: z.string().nullable().optional(),
  descricao: z.string().trim().min(1),
  quantidade: z.number().positive().max(100000),
  valorUnitCentavos: z.number().int().min(0).max(100000000),
});

export type ItemValidado = {
  tipo: "PECA" | "SERVICO";
  pecaId: string | null;
  servicoId: string | null;
  descricao: string;
  quantidade: number;
  valorUnitCentavos: number;
  totalCentavos: number;
  ordem: number;
};

export type ItensLidos =
  | { ok: true; itens: ItemValidado[]; subtotal: number }
  | { ok: false; erro: string };

export function lerItens(bruto: FormDataEntryValue | null): ItensLidos {
  let json: unknown;
  try {
    json = JSON.parse((bruto ?? "[]").toString());
  } catch {
    return { ok: false, erro: "Não foi possível ler a lista de itens. Recarregue a página." };
  }

  const analise = z.array(itemSchema).safeParse(json);
  if (!analise.success) {
    return {
      ok: false,
      erro: "Confira os itens: todo item precisa de descrição e quantidade maior que zero.",
    };
  }

  if (analise.data.length === 0) {
    return { ok: false, erro: "Adicione pelo menos um serviço ou peça." };
  }

  const itens: ItemValidado[] = analise.data.map((item, ordem) => ({
    tipo: item.tipo,
    pecaId: item.pecaId ?? null,
    servicoId: item.servicoId ?? null,
    descricao: item.descricao,
    quantidade: item.quantidade,
    valorUnitCentavos: item.valorUnitCentavos,
    totalCentavos: Math.round(item.quantidade * item.valorUnitCentavos),
    ordem,
  }));

  return {
    ok: true,
    itens,
    subtotal: itens.reduce((soma, i) => soma + i.totalCentavos, 0),
  };
}

/** Desconto nunca pode deixar o total negativo. */
export function aplicarDesconto(subtotal: number, descontoBruto: number) {
  const desconto = Math.max(0, Math.min(Math.round(descontoBruto), subtotal));
  return { desconto, total: subtotal - desconto };
}
