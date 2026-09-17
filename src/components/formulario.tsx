"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import { Aviso, Botao, cx } from "@/components/ui";
import type { Resultado } from "@/lib/erros";

type AcaoDeFormulario = (
  estadoAnterior: Resultado | null,
  dados: FormData,
) => Promise<Resultado>;

/**
 * Envolve um <form> que chama uma Server Action.
 * Cuida de tres coisas que toda tela precisa e ninguem deve reescrever:
 * mostrar o erro em portugues, desabilitar o botao enquanto salva e
 * impedir envio duplicado no clique nervoso.
 */
export function Formulario({
  acao,
  children,
  className,
}: {
  acao: AcaoDeFormulario;
  children: ReactNode;
  className?: string;
}) {
  const [estado, enviar] = useActionState(acao, null);

  return (
    <form action={enviar} className={cx("space-y-5", className)}>
      {estado && !estado.ok && <Aviso tom="vermelho">{estado.erro}</Aviso>}
      {children}
    </form>
  );
}

export function BotaoSalvar({
  children = "Salvar",
  variante = "primario",
  tamanho = "grande",
  className,
}: {
  children?: ReactNode;
  variante?: "primario" | "secundario" | "perigo" | "sucesso";
  tamanho?: "normal" | "grande" | "pequeno";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" variante={variante} tamanho={tamanho} disabled={pending} className={className}>
      {pending ? "Salvando..." : children}
    </Botao>
  );
}

/** Botao que dispara uma action simples e pede confirmacao antes. */
export function BotaoAcao({
  children,
  confirmar,
  variante = "secundario",
  tamanho = "pequeno",
  className,
}: {
  children: ReactNode;
  confirmar?: string;
  variante?: "primario" | "secundario" | "perigo" | "sucesso" | "fantasma";
  tamanho?: "normal" | "grande" | "pequeno";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Botao
      type="submit"
      variante={variante}
      tamanho={tamanho}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {pending ? "Aguarde..." : children}
    </Botao>
  );
}
