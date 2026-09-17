import { notFound } from "next/navigation";

import { excluirOS, mudarStatus } from "../acoes";
import { FormularioFaturamento } from "./faturamento";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { BotaoAcao } from "@/components/formulario";
import { TabelaItens } from "@/components/tabela-itens";
import {
  Aviso,
  Botao,
  BotaoLink,
  Cabecalho,
  Cartao,
  CartaoTitulo,
  Selo,
  cx,
} from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, dataHora, moeda, placa, telefone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { COLUNAS_PATIO, FORMA_PAGAMENTO, STATUS_OS } from "@/lib/rotulos";

export const metadata = { title: "Ordem de servico - Assetto" };

export default async function PaginaOS({ params }: { params: Promise<{ id: string }> }) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const ordem = await prisma.ordemServico.findFirst({
    where: { id, oficinaId },
    include: {
      cliente: true,
      veiculo: true,
      responsavel: true,
      orcamento: true,
      itens: { orderBy: { ordem: "asc" } },
      lancamentos: true,
    },
  });
  if (!ordem) notFound();

  const numero = String(ordem.numero).padStart(4, "0");
  const rotulo = STATUS_OS[ordem.status];
  const faturada = ordem.estoqueBaixado;
  const lancamento = ordem.lancamentos[0];

  return (
    <>
      <Cabecalho
        titulo={`OS ${numero}`}
        descricao={`${ordem.cliente.nome} - ${placa(ordem.veiculo.placa)} ${ordem.veiculo.marca} ${ordem.veiculo.modelo}`}
        acao={
          <>
            {!faturada && (
              <BotaoLink href={`/os/${ordem.id}/editar`} variante="secundario">
                Editar
              </BotaoLink>
            )}
            <BotaoLink href={`/os/${ordem.id}/imprimir`} variante="secundario">
              Ver via para impressao
            </BotaoLink>
            <BotaoImprimir />
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Selo tom={rotulo.tom} className="text-base">
          {rotulo.titulo}
        </Selo>
        {faturada && <Selo tom="verde">Faturada</Selo>}
        {ordem.previsaoEntrega && (
          <span className="text-slate-600">Previsao: {data(ordem.previsaoEntrega)}</span>
        )}
      </div>

      {ordem.status === "CANCELADO" && (
        <div className="mb-5">
          <Aviso tom="vermelho">Esta ordem de servico foi cancelada.</Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Cartao>
            <CartaoTitulo>Em que etapa esta o servico</CartaoTitulo>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {COLUNAS_PATIO.map((status) => {
                  const atual = ordem.status === status;
                  return (
                    <form key={status} action={mudarStatus}>
                      <input type="hidden" name="id" value={ordem.id} />
                      <input type="hidden" name="status" value={status} />
                      <input type="hidden" name="voltarPara" value={`/os/${ordem.id}`} />
                      <Botao
                        type="submit"
                        variante={atual ? "primario" : "secundario"}
                        tamanho="normal"
                        className={cx(atual && "ring-2 ring-marca-300")}
                      >
                        {STATUS_OS[status].titulo}
                      </Botao>
                    </form>
                  );
                })}
              </div>
              <p className="mt-3 text-slate-600">{rotulo.ajuda}</p>
            </div>
          </Cartao>

          {(ordem.descricaoProblema || ordem.diagnostico) && (
            <Cartao>
              <CartaoTitulo>Relato e diagnostico</CartaoTitulo>
              <div className="space-y-4 p-5">
                {ordem.descricaoProblema && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Cliente relatou</p>
                    <p className="whitespace-pre-wrap text-slate-900">{ordem.descricaoProblema}</p>
                  </div>
                )}
                {ordem.diagnostico && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Oficina encontrou</p>
                    <p className="whitespace-pre-wrap text-slate-900">{ordem.diagnostico}</p>
                  </div>
                )}
              </div>
            </Cartao>
          )}

          <Cartao>
            <CartaoTitulo>Pecas e servicos</CartaoTitulo>
            <TabelaItens
              itens={ordem.itens}
              descontoCentavos={ordem.descontoCentavos}
              totalCentavos={ordem.totalCentavos}
            />
          </Cartao>

          {ordem.observacoes && (
            <Cartao>
              <CartaoTitulo>Observacoes internas</CartaoTitulo>
              <p className="p-5 whitespace-pre-wrap text-slate-800">{ordem.observacoes}</p>
            </Cartao>
          )}
        </div>

        <div className="space-y-6">
          {!faturada && ordem.status !== "CANCELADO" ? (
            <Cartao>
              <CartaoTitulo>Fechar e cobrar</CartaoTitulo>
              <div className="p-5">
                <FormularioFaturamento ordemId={ordem.id} totalCentavos={ordem.totalCentavos} />
              </div>
            </Cartao>
          ) : (
            faturada && (
              <Cartao>
                <CartaoTitulo>Pagamento</CartaoTitulo>
                <div className="space-y-2 p-5">
                  <p className="text-2xl font-black text-slate-900">{moeda(ordem.totalCentavos)}</p>
                  {lancamento && (
                    <>
                      <p className="text-slate-700">
                        {lancamento.formaPagamento
                          ? FORMA_PAGAMENTO[lancamento.formaPagamento]
                          : "Forma nao informada"}
                      </p>
                      <Selo tom={lancamento.pagoEm ? "verde" : "amarelo"}>
                        {lancamento.pagoEm
                          ? `Recebido em ${data(lancamento.pagoEm)}`
                          : `A receber ate ${data(lancamento.vencimento)}`}
                      </Selo>
                    </>
                  )}
                  <div className="pt-2">
                    <BotaoLink href="/financeiro" variante="secundario" tamanho="pequeno">
                      Ver no financeiro
                    </BotaoLink>
                  </div>
                </div>
              </Cartao>
            )
          )}

          <Cartao>
            <CartaoTitulo>Informacoes</CartaoTitulo>
            <dl className="space-y-3 p-5 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Cliente</dt>
                <dd className="text-base text-slate-900">{ordem.cliente.nome}</dd>
                <dd className="text-slate-600">{telefone(ordem.cliente.telefone)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Mecanico responsavel</dt>
                <dd className="text-base text-slate-900">
                  {ordem.responsavel?.nome ?? "Nao definido"}
                </dd>
              </div>
              {ordem.kmEntrada !== null && (
                <div>
                  <dt className="font-semibold text-slate-500">KM na entrada</dt>
                  <dd className="text-base text-slate-900">
                    {ordem.kmEntrada.toLocaleString("pt-BR")} km
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-semibold text-slate-500">Aberta em</dt>
                <dd className="text-base text-slate-900">{dataHora(ordem.criadoEm)}</dd>
              </div>
              {ordem.finalizadoEm && (
                <div>
                  <dt className="font-semibold text-slate-500">Servico terminado</dt>
                  <dd className="text-base text-slate-900">{dataHora(ordem.finalizadoEm)}</dd>
                </div>
              )}
              {ordem.orcamento && (
                <div>
                  <dt className="font-semibold text-slate-500">Origem</dt>
                  <dd>
                    <BotaoLink
                      href={`/orcamentos/${ordem.orcamento.id}`}
                      variante="secundario"
                      tamanho="pequeno"
                    >
                      Orcamento {String(ordem.orcamento.numero).padStart(4, "0")}
                    </BotaoLink>
                  </dd>
                </div>
              )}
            </dl>
          </Cartao>

          <Cartao>
            <div className="p-5">
              <form action={excluirOS}>
                <input type="hidden" name="id" value={ordem.id} />
                <BotaoAcao
                  variante="perigo"
                  tamanho="normal"
                  className="w-full"
                  confirmar={
                    faturada
                      ? `Cancelar a OS ${numero}? Ela ja foi faturada, entao sera marcada como cancelada e o historico sera mantido.`
                      : `Excluir a OS ${numero}?`
                  }
                >
                  {faturada ? "Cancelar OS" : "Excluir OS"}
                </BotaoAcao>
              </form>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
