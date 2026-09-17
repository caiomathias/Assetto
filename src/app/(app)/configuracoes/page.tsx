import { alternarUsuario, criarUsuario, salvarOficina, trocarSenha } from "./acoes";
import { BotaoAcao, BotaoSalvar, Formulario } from "@/components/formulario";
import {
  Aviso,
  Cabecalho,
  Campo,
  Cartao,
  CartaoTitulo,
  Entrada,
  Selecao,
  Selo,
} from "@/components/ui";
import { exigirSessao, podeGerenciar } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAPEL } from "@/lib/rotulos";

export const metadata = { title: "Configuracoes - Assetto" };

export default async function PaginaConfiguracoes() {
  const sessao = await exigirSessao();
  const gerente = podeGerenciar(sessao.papel);

  const [oficina, usuarios] = await Promise.all([
    prisma.oficina.findUnique({ where: { id: sessao.oficinaId } }),
    prisma.usuario.findMany({
      where: { oficinaId: sessao.oficinaId },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    }),
  ]);

  if (!oficina) return null;

  return (
    <>
      <Cabecalho
        titulo="Configuracoes"
        descricao="Dados da oficina, equipe e sua senha."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Cartao>
            <CartaoTitulo>Dados da oficina</CartaoTitulo>
            <div className="p-5">
              {!gerente && (
                <div className="mb-4">
                  <Aviso tom="amarelo">
                    Apenas o dono ou o gerente podem alterar os dados da oficina.
                  </Aviso>
                </div>
              )}

              <Formulario acao={salvarOficina}>
                <div className="grid gap-5 sm:grid-cols-6">
                  <Campo rotulo="Nome da oficina" obrigatorio className="sm:col-span-4">
                    <Entrada name="nome" defaultValue={oficina.nome} required disabled={!gerente} />
                  </Campo>
                  <Campo rotulo="CNPJ" className="sm:col-span-2">
                    <Entrada name="cnpj" defaultValue={oficina.cnpj ?? ""} disabled={!gerente} />
                  </Campo>
                  <Campo rotulo="Telefone" className="sm:col-span-3">
                    <Entrada
                      name="telefone"
                      defaultValue={oficina.telefone ?? ""}
                      inputMode="tel"
                      disabled={!gerente}
                    />
                  </Campo>
                  <Campo rotulo="E-mail" className="sm:col-span-3">
                    <Entrada
                      name="email"
                      type="email"
                      defaultValue={oficina.email ?? ""}
                      disabled={!gerente}
                    />
                  </Campo>
                  <Campo rotulo="CEP" className="sm:col-span-2">
                    <Entrada name="cep" defaultValue={oficina.cep ?? ""} disabled={!gerente} />
                  </Campo>
                  <Campo rotulo="Rua" className="sm:col-span-3">
                    <Entrada
                      name="endereco"
                      defaultValue={oficina.endereco ?? ""}
                      disabled={!gerente}
                    />
                  </Campo>
                  <Campo rotulo="Numero" className="sm:col-span-1">
                    <Entrada name="numero" defaultValue={oficina.numero ?? ""} disabled={!gerente} />
                  </Campo>
                  <Campo rotulo="Bairro" className="sm:col-span-2">
                    <Entrada name="bairro" defaultValue={oficina.bairro ?? ""} disabled={!gerente} />
                  </Campo>
                  <Campo rotulo="Cidade" className="sm:col-span-3">
                    <Entrada name="cidade" defaultValue={oficina.cidade ?? ""} disabled={!gerente} />
                  </Campo>
                  <Campo rotulo="UF" className="sm:col-span-1">
                    <Entrada
                      name="uf"
                      defaultValue={oficina.uf ?? ""}
                      maxLength={2}
                      disabled={!gerente}
                    />
                  </Campo>
                </div>

                <p className="text-sm text-slate-500">
                  Esses dados aparecem no cabecalho dos orcamentos e das ordens de servico
                  impressas.
                </p>

                {gerente && <BotaoSalvar>Salvar dados da oficina</BotaoSalvar>}
              </Formulario>
            </div>
          </Cartao>

          <Cartao>
            <CartaoTitulo>Equipe</CartaoTitulo>
            <ul className="divide-y divide-slate-200">
              {usuarios.map((usuario) => (
                <li key={usuario.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {usuario.nome}
                      {usuario.id === sessao.usuarioId && (
                        <span className="ml-2 text-sm font-normal text-slate-500">(voce)</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-600">{usuario.email}</p>
                    <p className="text-sm text-slate-500">{PAPEL[usuario.papel].ajuda}</p>
                  </div>

                  <Selo tom={usuario.ativo ? "verde" : "cinza"}>
                    {PAPEL[usuario.papel].titulo}
                    {!usuario.ativo && " - inativo"}
                  </Selo>

                  {gerente && usuario.id !== sessao.usuarioId && (
                    <form action={alternarUsuario}>
                      <input type="hidden" name="id" value={usuario.id} />
                      <BotaoAcao
                        variante={usuario.ativo ? "secundario" : "sucesso"}
                        confirmar={
                          usuario.ativo
                            ? `Desativar ${usuario.nome}? A pessoa perde o acesso imediatamente.`
                            : undefined
                        }
                      >
                        {usuario.ativo ? "Desativar" : "Reativar"}
                      </BotaoAcao>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Cartao>
        </div>

        <div className="space-y-6">
          {gerente && (
            <Cartao>
              <CartaoTitulo>Adicionar pessoa</CartaoTitulo>
              <div className="p-5">
                <Formulario acao={criarUsuario} className="space-y-4">
                  <Campo rotulo="Nome" obrigatorio>
                    <Entrada name="nome" required />
                  </Campo>
                  <Campo rotulo="E-mail" ajuda="Sera o login dessa pessoa." obrigatorio>
                    <Entrada name="email" type="email" required />
                  </Campo>
                  <Campo rotulo="Senha inicial" ajuda="Minimo 6 caracteres." obrigatorio>
                    <Entrada name="senha" type="password" required minLength={6} />
                  </Campo>
                  <Campo rotulo="O que essa pessoa faz" obrigatorio>
                    <Selecao name="papel" defaultValue="ATENDENTE">
                      {Object.entries(PAPEL).map(([valor, info]) => (
                        <option key={valor} value={valor}>
                          {info.titulo}
                        </option>
                      ))}
                    </Selecao>
                  </Campo>
                  <BotaoSalvar tamanho="normal" className="w-full">
                    Adicionar
                  </BotaoSalvar>
                </Formulario>
              </div>
            </Cartao>
          )}

          <Cartao>
            <CartaoTitulo>Trocar minha senha</CartaoTitulo>
            <div className="p-5">
              <Formulario acao={trocarSenha} className="space-y-4">
                <Campo rotulo="Senha atual" obrigatorio>
                  <Entrada name="senhaAtual" type="password" required />
                </Campo>
                <Campo rotulo="Nova senha" obrigatorio>
                  <Entrada name="senhaNova" type="password" required minLength={6} />
                </Campo>
                <Campo rotulo="Repita a nova senha" obrigatorio>
                  <Entrada name="confirmacao" type="password" required />
                </Campo>
                <BotaoSalvar tamanho="normal" className="w-full">
                  Trocar senha
                </BotaoSalvar>
              </Formulario>
            </div>
          </Cartao>

          <Cartao>
            <CartaoTitulo>Plano</CartaoTitulo>
            <div className="space-y-2 p-5">
              <Selo tom="azul">{oficina.plano}</Selo>
              <p className="text-slate-600">
                O controle de assinatura ainda nao esta ativo. Todas as funcoes estao liberadas.
              </p>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
