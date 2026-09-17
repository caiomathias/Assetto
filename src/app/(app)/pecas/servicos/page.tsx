import { excluirServico, salvarServico } from "../acoes";
import { AbasPecas } from "../abas";
import { BotaoAcao, BotaoSalvar, Formulario } from "@/components/formulario";
import {
  BotaoLink,
  Cabecalho,
  Campo,
  Cartao,
  CartaoTitulo,
  Entrada,
  Vazio,
} from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { moeda, moedaSimples } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Serviços - Assetto" };

export default async function PaginaServicos({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { editar } = await searchParams;

  const servicos = await prisma.servico.findMany({
    where: { oficinaId, ativo: true },
    orderBy: { nome: "asc" },
  });

  const emEdicao = editar ? servicos.find((s) => s.id === editar) : undefined;

  return (
    <>
      <Cabecalho
        titulo="Serviços"
        descricao="A mão de obra que a oficina cobra. Aparece pronta no orçamento."
      />

      <AbasPecas atual="servicos" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Cartao>
            {servicos.length === 0 ? (
              <Vazio
                titulo="Nenhum serviço cadastrado"
                descricao="Cadastre os serviços mais comuns (troca de óleo, alinhamento, revisão) para não ter que digitar toda vez."
              />
            ) : (
              <ul className="divide-y divide-slate-200">
                {servicos.map((servico) => (
                  <li key={servico.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-slate-900">{servico.nome}</p>
                      {servico.descricao && (
                        <p className="text-slate-600">{servico.descricao}</p>
                      )}
                      {servico.tempoEstimadoMin && (
                        <p className="text-sm text-slate-500">
                          Tempo estimado: {servico.tempoEstimadoMin} min
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      {moeda(servico.precoCentavos)}
                    </span>
                    <div className="flex gap-2">
                      <BotaoLink
                        href={`/pecas/servicos?editar=${servico.id}`}
                        variante="secundario"
                        tamanho="pequeno"
                      >
                        Editar
                      </BotaoLink>
                      <form action={excluirServico}>
                        <input type="hidden" name="id" value={servico.id} />
                        <BotaoAcao variante="fantasma" confirmar={`Excluir "${servico.nome}"?`}>
                          Excluir
                        </BotaoAcao>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>

        <div>
          <Cartao>
            <CartaoTitulo>{emEdicao ? "Editar serviço" : "Novo serviço"}</CartaoTitulo>
            <div className="p-5">
              <Formulario acao={salvarServico} className="space-y-4">
                {emEdicao && <input type="hidden" name="id" value={emEdicao.id} />}

                <Campo rotulo="Nome do serviço" obrigatorio>
                  <Entrada
                    name="nome"
                    defaultValue={emEdicao?.nome}
                    required
                    placeholder="Troca de óleo e filtro"
                    key={emEdicao?.id ?? "novo"}
                  />
                </Campo>

                <Campo rotulo="Descrição (opcional)">
                  <Entrada name="descricao" defaultValue={emEdicao?.descricao ?? ""} />
                </Campo>

                <Campo rotulo="Preço (R$)" obrigatorio>
                  <Entrada
                    name="preco"
                    inputMode="decimal"
                    defaultValue={emEdicao ? moedaSimples(emEdicao.precoCentavos) : "0,00"}
                  />
                </Campo>

                <Campo rotulo="Tempo estimado (minutos)" ajuda="Ajuda a organizar a agenda.">
                  <Entrada
                    name="tempoEstimadoMin"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    defaultValue={emEdicao?.tempoEstimadoMin ?? ""}
                  />
                </Campo>

                <div className="flex flex-wrap gap-2">
                  <BotaoSalvar tamanho="normal">
                    {emEdicao ? "Salvar" : "Adicionar serviço"}
                  </BotaoSalvar>
                  {emEdicao && (
                    <BotaoLink href="/pecas/servicos" variante="secundario">
                      Cancelar
                    </BotaoLink>
                  )}
                </div>
              </Formulario>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
