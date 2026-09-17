import { notFound } from "next/navigation";

import {
  converterEmOS,
  enviarAoCliente,
  excluirOrcamento,
  responderNoBalcao,
} from "../acoes";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { BotaoAcao } from "@/components/formulario";
import { LinkAprovacao } from "@/components/link-aprovacao";
import { TabelaItens } from "@/components/tabela-itens";
import {
  Aviso,
  BotaoLink,
  Cabecalho,
  Cartao,
  CartaoTitulo,
  Entrada,
  Selo,
} from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, dataHora, moeda, placa, soDigitos, telefone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { STATUS_ORCAMENTO } from "@/lib/rotulos";
import { urlDoApp } from "@/lib/url";

export const metadata = { title: "Orcamento - Assetto" };

export default async function PaginaOrcamento({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const orcamento = await prisma.orcamento.findFirst({
    where: { id, oficinaId: sessao.oficinaId },
    include: {
      cliente: true,
      veiculo: true,
      criadoPor: true,
      itens: { orderBy: { ordem: "asc" } },
      ordemServico: true,
    },
  });
  if (!orcamento) notFound();

  const numero = String(orcamento.numero).padStart(4, "0");
  const rotulo = STATUS_ORCAMENTO[orcamento.status];
  const base = await urlDoApp();
  const linkPublico = `${base}/orcamento/${orcamento.tokenPublico}`;

  const podeEditar = orcamento.status !== "CONVERTIDO";
  const aguardandoResposta = orcamento.status === "RASCUNHO" || orcamento.status === "ENVIADO";

  return (
    <>
      <Cabecalho
        titulo={`Orcamento ${numero}`}
        descricao={`${orcamento.cliente.nome} - ${placa(orcamento.veiculo.placa)} ${orcamento.veiculo.marca} ${orcamento.veiculo.modelo}`}
        acao={
          <>
            {podeEditar && (
              <BotaoLink href={`/orcamentos/${orcamento.id}/editar`} variante="secundario">
                Editar
              </BotaoLink>
            )}
            <BotaoLink href={`/orcamentos/${orcamento.id}/imprimir`} variante="secundario">
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
        {orcamento.validadeAte && (
          <span className="text-slate-600">Vale ate {data(orcamento.validadeAte)}</span>
        )}
      </div>

      {orcamento.status === "APROVADO" && !orcamento.ordemServico && (
        <div className="mb-5">
          <Aviso tom="verde">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold">
                O cliente aprovou. Agora e so abrir a ordem de servico.
              </span>
              <form action={converterEmOS}>
                <input type="hidden" name="id" value={orcamento.id} />
                <BotaoAcao variante="sucesso" tamanho="normal">
                  Abrir ordem de servico
                </BotaoAcao>
              </form>
            </div>
          </Aviso>
        </div>
      )}

      {orcamento.ordemServico && (
        <div className="mb-5">
          <Aviso tom="azul">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Este orcamento virou a OS{" "}
                <strong>{String(orcamento.ordemServico.numero).padStart(4, "0")}</strong>.
              </span>
              <BotaoLink href={`/os/${orcamento.ordemServico.id}`} tamanho="pequeno">
                Ver ordem de servico
              </BotaoLink>
            </div>
          </Aviso>
        </div>
      )}

      {orcamento.status === "RECUSADO" && (
        <div className="mb-5">
          <Aviso tom="vermelho">
            <strong>Cliente recusou</strong>
            {orcamento.respondidoEm && ` em ${dataHora(orcamento.respondidoEm)}`}.
            {orcamento.motivoRecusa && (
              <span className="mt-1 block">Motivo: {orcamento.motivoRecusa}</span>
            )}
          </Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {orcamento.descricaoProblema && (
            <Cartao>
              <CartaoTitulo>Problema relatado</CartaoTitulo>
              <p className="p-5 whitespace-pre-wrap text-slate-800">
                {orcamento.descricaoProblema}
              </p>
            </Cartao>
          )}

          <Cartao>
            <CartaoTitulo>Pecas e servicos</CartaoTitulo>
            <TabelaItens
              itens={orcamento.itens}
              descontoCentavos={orcamento.descontoCentavos}
              totalCentavos={orcamento.totalCentavos}
            />
          </Cartao>

          {orcamento.observacoes && (
            <Cartao>
              <CartaoTitulo>Observacoes</CartaoTitulo>
              <p className="p-5 whitespace-pre-wrap text-slate-800">{orcamento.observacoes}</p>
            </Cartao>
          )}
        </div>

        <div className="space-y-6">
          <Cartao>
            <CartaoTitulo>Enviar ao cliente</CartaoTitulo>
            <div className="space-y-4 p-5">
              {orcamento.status === "RASCUNHO" ? (
                <>
                  <p className="text-slate-700">
                    Marque como enviado para liberar o link de aprovacao do cliente.
                  </p>
                  <form action={enviarAoCliente}>
                    <input type="hidden" name="id" value={orcamento.id} />
                    <BotaoAcao variante="primario" tamanho="normal" className="w-full">
                      Marcar como enviado
                    </BotaoAcao>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-slate-700">
                    O cliente abre este link no celular e clica em aprovar ou recusar.
                  </p>
                  <LinkAprovacao
                    url={linkPublico}
                    telefone={soDigitos(orcamento.cliente.telefone)}
                    numero={numero}
                    oficina={sessao.oficinaNome}
                  />
                </>
              )}
            </div>
          </Cartao>

          {aguardandoResposta && (
            <Cartao>
              <CartaoTitulo>Cliente respondeu por telefone?</CartaoTitulo>
              <div className="space-y-3 p-5">
                <form action={responderNoBalcao} className="space-y-3">
                  <input type="hidden" name="id" value={orcamento.id} />
                  <input type="hidden" name="resposta" value="APROVADO" />
                  <BotaoAcao variante="sucesso" tamanho="normal" className="w-full">
                    Registrar aprovacao
                  </BotaoAcao>
                </form>

                <form action={responderNoBalcao} className="space-y-2">
                  <input type="hidden" name="id" value={orcamento.id} />
                  <input type="hidden" name="resposta" value="RECUSADO" />
                  <Entrada name="motivo" placeholder="Motivo da recusa (opcional)" />
                  <BotaoAcao variante="secundario" tamanho="normal" className="w-full">
                    Registrar recusa
                  </BotaoAcao>
                </form>
              </div>
            </Cartao>
          )}

          <Cartao>
            <CartaoTitulo>Informacoes</CartaoTitulo>
            <dl className="space-y-3 p-5 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Cliente</dt>
                <dd className="text-base text-slate-900">{orcamento.cliente.nome}</dd>
                <dd className="text-slate-600">{telefone(orcamento.cliente.telefone)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Criado em</dt>
                <dd className="text-base text-slate-900">{dataHora(orcamento.criadoEm)}</dd>
              </div>
              {orcamento.criadoPor && (
                <div>
                  <dt className="font-semibold text-slate-500">Criado por</dt>
                  <dd className="text-base text-slate-900">{orcamento.criadoPor.nome}</dd>
                </div>
              )}
              {orcamento.respondidoEm && (
                <div>
                  <dt className="font-semibold text-slate-500">Resposta do cliente</dt>
                  <dd className="text-base text-slate-900">{dataHora(orcamento.respondidoEm)}</dd>
                  {orcamento.respondidoPor && (
                    <dd className="text-slate-600">{orcamento.respondidoPor}</dd>
                  )}
                </div>
              )}
              <div>
                <dt className="font-semibold text-slate-500">Total</dt>
                <dd className="text-xl font-bold text-slate-900">
                  {moeda(orcamento.totalCentavos)}
                </dd>
              </div>
            </dl>
          </Cartao>

          {podeEditar && (
            <Cartao>
              <div className="p-5">
                <form action={excluirOrcamento}>
                  <input type="hidden" name="id" value={orcamento.id} />
                  <BotaoAcao
                    variante="perigo"
                    tamanho="normal"
                    className="w-full"
                    confirmar={`Excluir o orcamento ${numero}?`}
                  >
                    Excluir orcamento
                  </BotaoAcao>
                </form>
              </div>
            </Cartao>
          )}
        </div>
      </div>
    </>
  );
}
