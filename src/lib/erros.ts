/** Resultado padrão de toda Server Action que um formulario chama. */
export type Resultado = { ok: true; id?: string } | { ok: false; erro: string };

export function falha(erro: string): Resultado {
  return { ok: false, erro };
}

export function sucesso(id?: string): Resultado {
  return { ok: true, id };
}

/**
 * Traduz erros do banco para uma frase que o balconista entende.
 * Nunca vaza stack trace para a tela.
 */
export function mensagemDeErro(e: unknown): string {
  const codigo = (e as { code?: string })?.code;

  if (codigo === "P2002") return "Já existe um registro com esses dados.";
  if (codigo === "P2003") return "Este registro está sendo usado em outro lugar e não pode ser alterado.";
  if (codigo === "P2025") return "Registro não encontrado.";

  if (e instanceof Error && e.message) return e.message;
  return "Não foi possível concluir. Tente novamente.";
}
