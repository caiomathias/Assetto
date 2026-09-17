import Link from "next/link";

import { cx } from "@/components/ui";

export function AbasPecas({ atual }: { atual: "pecas" | "servicos" }) {
  const abas = [
    { chave: "pecas", href: "/pecas", titulo: "Pecas em estoque" },
    { chave: "servicos", href: "/pecas/servicos", titulo: "Servicos e mao de obra" },
  ];

  return (
    <div className="mb-5 flex gap-2 border-b border-slate-300">
      {abas.map((aba) => (
        <Link
          key={aba.chave}
          href={aba.href}
          className={cx(
            "-mb-px border-b-2 px-4 py-3 font-semibold",
            atual === aba.chave
              ? "border-marca-600 text-marca-700"
              : "border-transparent text-slate-600 hover:text-slate-900",
          )}
        >
          {aba.titulo}
        </Link>
      ))}
    </div>
  );
}
