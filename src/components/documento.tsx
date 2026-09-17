import { TabelaItens, type ItemExibido } from "@/components/tabela-itens";
import { data, documento as formatarDoc, moeda, placa, telefone } from "@/lib/format";

export type DadosOficina = {
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

/**
 * Via impressa de orçamento e de OS. Mesmo layout para os dois: o cliente
 * reconhece o documento, é a oficina só tem um modelo para conferir.
 * Pensado para caber em uma folha A4.
 */
export function Documento({
  tipo,
  numero,
  emissao,
  oficina,
  cliente,
  veiculo,
  problema,
  observacoes,
  itens,
  descontoCentavos,
  totalCentavos,
  rodape,
}: {
  tipo: string;
  numero: string;
  emissao: Date;
  oficina: DadosOficina;
  cliente: {
    nome: string;
    telefone: string;
    documento: string | null;
    endereco?: string | null;
  };
  veiculo: {
    placa: string;
    marca: string;
    modelo: string;
    anoFabricacao: number | null;
    cor: string | null;
    kmAtual?: number | null;
  };
  problema?: string | null;
  observacoes?: string | null;
  itens: ItemExibido[];
  descontoCentavos: number;
  totalCentavos: number;
  rodape?: React.ReactNode;
}) {
  const enderecoOficina = [
    oficina.endereco && `${oficina.endereco}${oficina.numero ? `, ${oficina.numero}` : ""}`,
    oficina.bairro,
    oficina.cidade && `${oficina.cidade}${oficina.uf ? ` - ${oficina.uf}` : ""}`,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="print-page mx-auto max-w-3xl bg-white p-6 text-slate-900 ring-1 ring-slate-200 sm:p-10 print:ring-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-4">
        <div>
          <p className="text-2xl font-black">{oficina.nome}</p>
          {oficina.cnpj && <p className="text-sm">CNPJ {formatarDoc(oficina.cnpj)}</p>}
          {enderecoOficina && <p className="text-sm">{enderecoOficina}</p>}
          <p className="text-sm">
            {[oficina.telefone && telefone(oficina.telefone), oficina.email]
              .filter(Boolean)
              .join(" - ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tracking-wide uppercase">{tipo}</p>
          <p className="text-3xl font-black">{numero}</p>
          <p className="text-sm">Emitido em {data(emissao)}</p>
        </div>
      </header>

      <section className="grid gap-4 border-b border-slate-300 py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Cliente</p>
          <p className="font-semibold">{cliente.nome}</p>
          <p className="text-sm">{telefone(cliente.telefone)}</p>
          {cliente.documento && <p className="text-sm">{formatarDoc(cliente.documento)}</p>}
          {cliente.endereco && <p className="text-sm">{cliente.endereco}</p>}
        </div>
        <div>
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Veículo</p>
          <p className="font-semibold">
            {placa(veiculo.placa)} - {veiculo.marca} {veiculo.modelo}
          </p>
          <p className="text-sm">
            {[
              veiculo.anoFabricacao,
              veiculo.cor,
              veiculo.kmAtual != null && `${veiculo.kmAtual.toLocaleString("pt-BR")} km`,
            ]
              .filter(Boolean)
              .join(" - ")}
          </p>
        </div>
      </section>

      {problema && (
        <section className="border-b border-slate-300 py-4">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Problema relatado
          </p>
          <p className="whitespace-pre-wrap">{problema}</p>
        </section>
      )}

      <section className="py-4">
        <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
          <TabelaItens
            itens={itens}
            descontoCentavos={descontoCentavos}
            totalCentavos={totalCentavos}
          />
        </div>
      </section>

      {observacoes && (
        <section className="border-t border-slate-300 py-4">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Observações</p>
          <p className="whitespace-pre-wrap">{observacoes}</p>
        </section>
      )}

      <section className="border-t-2 border-slate-800 pt-4">
        <p className="text-lg font-bold">Total: {moeda(totalCentavos)}</p>
        {rodape && <div className="mt-2 text-sm text-slate-600">{rodape}</div>}
      </section>

      <section className="mt-12 grid gap-10 sm:grid-cols-2">
        <div className="border-t border-slate-400 pt-2 text-center text-sm">
          Assinatura do cliente
        </div>
        <div className="border-t border-slate-400 pt-2 text-center text-sm">
          Responsável pela oficina
        </div>
      </section>
    </div>
  );
}
