"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Icone } from "@/components/icones";
import { cx } from "@/components/ui";

type Item = {
  href: string;
  titulo: string;
  icone: keyof typeof Icone;
};

/**
 * Ordem intencional: segue o dia de trabalho da oficina, não a ordem
 * alfabetica. Pátio vem primeiro porque é a tela que fica aberta o dia todo.
 */
const ITENS: Item[] = [
  { href: "/painel", titulo: "Painel", icone: "painel" },
  { href: "/patio", titulo: "Pátio", icone: "patio" },
  { href: "/clientes", titulo: "Clientes", icone: "cliente" },
  { href: "/orcamentos", titulo: "Orçamentos", icone: "orcamento" },
  { href: "/os", titulo: "Ordens de serviço", icone: "os" },
  { href: "/pecas", titulo: "Peças", icone: "peca" },
  { href: "/financeiro", titulo: "Financeiro", icone: "financeiro" },
  { href: "/crm", titulo: "CRM", icone: "crm" },
  { href: "/configuracoes", titulo: "Configurações", icone: "config" },
];

function estaAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function Links({ aoNavegar }: { aoNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {ITENS.map((item) => {
        const Simbolo = Icone[item.icone];
        const ativo = estaAtivo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={aoNavegar}
            aria-current={ativo ? "page" : undefined}
            className={cx(
              "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-semibold transition-colors",
              ativo
                ? "bg-marca-600 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Simbolo className="h-5 w-5 shrink-0" />
            {item.titulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function MenuLateral() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0">
        <div className="px-5 py-5">
          <Link href="/painel" className="text-2xl font-black tracking-tight text-marca-700">
            Assetto
          </Link>
        </div>
        <Links />
      </div>
    </aside>
  );
}

export function MenuCelular() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // Fecha o menu ao trocar de página - senao ele fica por cima do conteudo.
  useEffect(() => setAberto(false), [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
      >
        <Icone.menu className="h-6 w-6" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setAberto(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-2xl font-black tracking-tight text-marca-700">Assetto</span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
              >
                <Icone.fechar className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <Links aoNavegar={() => setAberto(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
