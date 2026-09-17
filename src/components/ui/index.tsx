import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import type { Tom } from "@/lib/rotulos";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Selo de status
// ---------------------------------------------------------------------------

const TONS: Record<Tom, string> = {
  cinza: "bg-slate-100 text-slate-700 ring-slate-200",
  azul: "bg-blue-100 text-blue-800 ring-blue-200",
  amarelo: "bg-amber-100 text-amber-800 ring-amber-200",
  verde: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  vermelho: "bg-red-100 text-red-800 ring-red-200",
  roxo: "bg-violet-100 text-violet-800 ring-violet-200",
  laranja: "bg-orange-100 text-orange-800 ring-orange-200",
};

export function Selo({
  tom = "cinza",
  children,
  className,
}: {
  tom?: Tom;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ring-inset whitespace-nowrap",
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Botoes
// ---------------------------------------------------------------------------

type Variante = "primario" | "secundario" | "perigo" | "sucesso" | "fantasma";
type Tamanho = "normal" | "grande" | "pequeno";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-marca-600 text-white hover:bg-marca-700 shadow-sm",
  secundario: "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 shadow-sm",
  perigo: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  sucesso: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  fantasma: "text-slate-700 hover:bg-slate-100",
};

const TAMANHOS: Record<Tamanho, string> = {
  pequeno: "min-h-9 px-3 text-sm gap-1.5",
  normal: "min-h-11 px-4 text-base gap-2",
  grande: "min-h-14 px-6 text-lg gap-2.5",
};

function classesBotao(variante: Variante, tamanho: Tamanho, className?: string) {
  return cx(
    "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className,
  );
}

export function Botao({
  variante = "primario",
  tamanho = "normal",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; tamanho?: Tamanho }) {
  return <button {...props} className={classesBotao(variante, tamanho, className)} />;
}

export function BotaoLink({
  variante = "primario",
  tamanho = "normal",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; tamanho?: Tamanho }) {
  return <Link {...props} className={classesBotao(variante, tamanho, className)} />;
}

// ---------------------------------------------------------------------------
// Cartao
// ---------------------------------------------------------------------------

export function Cartao({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CartaoTitulo({
  children,
  acao,
}: {
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <h2 className="text-lg font-bold text-slate-900">{children}</h2>
      {acao}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campos de formulario
// ---------------------------------------------------------------------------

const BASE_CAMPO =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 " +
  "placeholder:text-slate-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-200 " +
  "disabled:bg-slate-100 disabled:text-slate-500";

export function Campo({
  rotulo,
  ajuda,
  obrigatorio,
  children,
  className,
}: {
  rotulo: string;
  ajuda?: string;
  obrigatorio?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">
        {rotulo}
        {obrigatorio && <span className="ml-1 text-red-600">*</span>}
      </span>
      {children}
      {ajuda && <span className="mt-1 block text-sm text-slate-500">{ajuda}</span>}
    </label>
  );
}

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(BASE_CAMPO, className)} />;
}

export function Selecao({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(BASE_CAMPO, "pr-8", className)} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(BASE_CAMPO, "min-h-24 py-2.5", className)} />;
}

// ---------------------------------------------------------------------------
// Estados de tela
// ---------------------------------------------------------------------------

export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-slate-800">{titulo}</p>
      {descricao && <p className="max-w-md text-slate-600">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

export function Aviso({
  tom = "azul",
  children,
}: {
  tom?: "azul" | "amarelo" | "vermelho" | "verde";
  children: ReactNode;
}) {
  const tons = {
    azul: "bg-blue-50 text-blue-900 ring-blue-200",
    amarelo: "bg-amber-50 text-amber-900 ring-amber-200",
    vermelho: "bg-red-50 text-red-900 ring-red-200",
    verde: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  };
  return (
    <div className={cx("rounded-lg px-4 py-3 text-base ring-1 ring-inset", tons[tom])}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cabecalho de pagina
// ---------------------------------------------------------------------------

export function Cabecalho({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-slate-600">{descricao}</p>}
      </div>
      {acao && <div className="flex flex-wrap gap-2">{acao}</div>}
    </div>
  );
}
