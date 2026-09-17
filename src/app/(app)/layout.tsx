import type { ReactNode } from "react";

import { sair } from "../(auth)/acoes";
import { MenuCelular, MenuLateral } from "@/components/navegacao";
import { Botao } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { iniciais } from "@/lib/format";

export default async function LayoutSistema({ children }: { children: ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <div className="flex min-h-screen">
      <MenuLateral />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 sm:px-5">
          <MenuCelular />

          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-slate-900">{sessao.oficinaNome}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{sessao.nome}</p>
              <p className="text-xs text-slate-500">{sessao.email}</p>
            </div>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marca-100 text-sm font-bold text-marca-700"
              title={sessao.nome}
            >
              {iniciais(sessao.nome)}
            </div>
            <form action={sair}>
              <Botao type="submit" variante="secundario" tamanho="pequeno">
                Sair
              </Botao>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
