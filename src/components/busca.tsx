import { Icone } from "@/components/icones";

/**
 * Busca por GET simples (sem JavaScript). Funciona no celular ruim do
 * balcão, mantém o termo na URL é o botão "voltar" do navegador faz o
 * esperado.
 */
export function Busca({
  acao,
  valor,
  placeholder = "Buscar...",
}: {
  acao: string;
  valor?: string;
  placeholder?: string;
}) {
  return (
    <form action={acao} className="flex w-full max-w-lg gap-2">
      <div className="relative flex-1">
        <Icone.busca className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={valor}
          placeholder={placeholder}
          className="w-full min-h-11 rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-10 text-base placeholder:text-slate-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 rounded-lg bg-slate-800 px-4 font-semibold text-white hover:bg-slate-900"
      >
        Buscar
      </button>
    </form>
  );
}
