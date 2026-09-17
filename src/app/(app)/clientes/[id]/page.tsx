import Link from "next/link";
import { notFound } from "next/navigation";

import { excluirCliente, excluirVeiculo } from "../acoes";
import { BotaoAcao } from "@/components/formulario";
import { Icone } from "@/components/icones";
import {
  Aviso,
  BotaoLink,
  Cabecalho,
  Cartao,
  CartaoTitulo,
  Selo,
  Vazio,
} from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, documento, moeda, placa, soDigitos, telefone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { COMBUSTIVEL, STATUS_ORCAMENTO, STATUS_OS, TIPO_PESSOA } from "@/lib/rotulos";

export const metadata = { title: "Cliente - Assetto" };

const ERROS: Record<string, string> = {
  historico:
    "Este cliente tem orçamentos ou ordens de serviço e não pode ser excluido. O histórico da oficina depende dele.",
  "veiculo-historico":
    "Este veículo tem ordens de serviço e não pode ser excluido. O histórico de manutenção depende dele.",
};

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-slate-500">{rotulo}</dt>
      <dd className="text-slate-900">{valor || "-"}</dd>
    </div>
  );
}

export default async function PaginaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;
  const { erro } = await searchParams;

  const cliente = await prisma.cliente.findFirst({
    where: { id, oficinaId },
    include: {
      veiculos: { orderBy: { criadoEm: "desc" } },
      ordensServico: {
        orderBy: { criadoEm: "desc" },
        take: 10,
        include: { veiculo: true },
      },
      orcamentos: {
        orderBy: { criadoEm: "desc" },
        take: 10,
        include: { veiculo: true },
      },
    },
  });

  if (!cliente) notFound();

  const enderecoCompleto = [
    cliente.endereco && `${cliente.endereco}${cliente.numero ? `, ${cliente.numero}` : ""}`,
    cliente.complemento,
    cliente.bairro,
    cliente.cidade && `${cliente.cidade}${cliente.uf ? ` - ${cliente.uf}` : ""}`,
  ]
    .filter(Boolean)
    .join(" - ");

  const zap = soDigitos(cliente.telefone);

  return (
    <>
      <Cabecalho
        titulo={cliente.nome}
        descricao={TIPO_PESSOA[cliente.tipoPessoa]}
        acao={
          <>
            <BotaoLink href={`/orcamentos/novo?cliente=${cliente.id}`}>
              <Icone.mais className="h-5 w-5" />
              Novo orçamento
            </BotaoLink>
            <BotaoLink href={`/clientes/${cliente.id}/editar`} variante="secundario">
              Editar
            </BotaoLink>
          </>
        }
      />

      {erro && ERROS[erro] && (
        <div className="mb-5">
          <Aviso tom="vermelho">{ERROS[erro]}</Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Cartao>
            <CartaoTitulo
              acao={
                <BotaoLink href={`/clientes/${cliente.id}/veiculos/novo`} tamanho="pequeno">
                  <Icone.mais className="h-4 w-4" />
                  Adicionar veículo
                </BotaoLink>
              }
            >
              Veículos
            </CartaoTitulo>

            {cliente.veiculos.length === 0 ? (
              <Vazio
                titulo="Nenhum veículo cadastrado"
                descricao="Cadastre o carro do cliente para poder abrir orçamentos e ordens de serviço."
                acao={
                  <BotaoLink href={`/clientes/${cliente.id}/veiculos/novo`}>
                    Adicionar veículo
                  </BotaoLink>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-200">
                {cliente.veiculos.map((veiculo) => (
                  <li key={veiculo.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-white">
                          {placa(veiculo.placa)}
                        </span>
                        <span className="text-lg font-semibold text-slate-900">
                          {veiculo.marca} {veiculo.modelo}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-600">
                        {[
                          veiculo.anoFabricacao &&
                            `${veiculo.anoFabricacao}${veiculo.anoModelo ? `/${veiculo.anoModelo}` : ""}`,
                          veiculo.cor,
                          COMBUSTIVEL[veiculo.combustivel],
                          veiculo.kmAtual !== null &&
                            `${veiculo.kmAtual.toLocaleString("pt-BR")} km`,
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <BotaoLink
                        href={`/clientes/${cliente.id}/veiculos/${veiculo.id}`}
                        variante="secundario"
                        tamanho="pequeno"
                      >
                        Editar
                      </BotaoLink>
                      <form action={excluirVeiculo}>
                        <input type="hidden" name="id" value={veiculo.id} />
                        <input type="hidden" name="clienteId" value={cliente.id} />
                        <BotaoAcao
                          variante="fantasma"
                          confirmar={`Excluir o veículo ${placa(veiculo.placa)}?`}
                        >
                          Excluir
                        </BotaoAcao>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao>
            <CartaoTitulo>Últimas ordens de serviço</CartaoTitulo>
            {cliente.ordensServico.length === 0 ? (
              <Vazio titulo="Nenhum serviço feito ainda" />
            ) : (
              <ul className="divide-y divide-slate-200">
                {cliente.ordensServico.map((os) => (
                  <li key={os.id}>
                    <Link
                      href={`/os/${os.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          OS {String(os.numero).padStart(4, "0")} - {placa(os.veiculo.placa)}
                        </p>
                        <p className="text-sm text-slate-600">{data(os.criadoEm)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold text-slate-900">
                          {moeda(os.totalCentavos)}
                        </span>
                        <Selo tom={STATUS_OS[os.status].tom}>{STATUS_OS[os.status].titulo}</Selo>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao>
            <CartaoTitulo>Últimos orçamentos</CartaoTitulo>
            {cliente.orcamentos.length === 0 ? (
              <Vazio titulo="Nenhum orçamento feito ainda" />
            ) : (
              <ul className="divide-y divide-slate-200">
                {cliente.orcamentos.map((orc) => (
                  <li key={orc.id}>
                    <Link
                      href={`/orcamentos/${orc.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          Orçamento {String(orc.numero).padStart(4, "0")} -{" "}
                          {placa(orc.veiculo.placa)}
                        </p>
                        <p className="text-sm text-slate-600">{data(orc.criadoEm)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold text-slate-900">
                          {moeda(orc.totalCentavos)}
                        </span>
                        <Selo tom={STATUS_ORCAMENTO[orc.status].tom}>
                          {STATUS_ORCAMENTO[orc.status].titulo}
                        </Selo>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao>
            <CartaoTitulo>Contato</CartaoTitulo>
            <dl className="space-y-4 p-5">
              <Linha rotulo="Telefone" valor={telefone(cliente.telefone)} />
              <Linha rotulo="E-mail" valor={cliente.email} />
              <Linha rotulo="CPF / CNPJ" valor={cliente.documento && documento(cliente.documento)} />
              <Linha rotulo="Endereco" valor={enderecoCompleto} />
              <Linha rotulo="Cliente desde" valor={data(cliente.criadoEm)} />
            </dl>
            {zap.length >= 10 && (
              <div className="border-t border-slate-200 p-5">
                <a
                  href={`https://wa.me/55${zap}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700"
                >
                  <Icone.whatsapp className="h-5 w-5" />
                  Chamar no WhatsApp
                </a>
              </div>
            )}
          </Cartao>

          {cliente.observacoes && (
            <Cartao>
              <CartaoTitulo>Observações</CartaoTitulo>
              <p className="p-5 whitespace-pre-wrap text-slate-800">{cliente.observacoes}</p>
            </Cartao>
          )}

          <Cartao>
            <div className="p-5">
              <form action={excluirCliente}>
                <input type="hidden" name="id" value={cliente.id} />
                <BotaoAcao
                  variante="perigo"
                  tamanho="normal"
                  className="w-full"
                  confirmar={`Excluir o cliente ${cliente.nome}? Essa ação não pode ser desfeita.`}
                >
                  Excluir cliente
                </BotaoAcao>
              </form>
              <p className="mt-2 text-sm text-slate-500">
                Só é possível excluir clientes que nunca tiveram orçamento ou ordem de serviço.
              </p>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
