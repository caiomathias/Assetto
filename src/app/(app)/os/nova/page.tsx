import { FormularioOS } from "../formulario-os";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { carregarCatalogo, carregarClientes } from "@/lib/consultas";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Nova ordem de servico - Assetto" };

export default async function PaginaNovaOS({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { cliente } = await searchParams;

  const [clientes, catalogo, mecanicos] = await Promise.all([
    carregarClientes(oficinaId),
    carregarCatalogo(oficinaId),
    prisma.usuario.findMany({
      where: { oficinaId, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  if (clientes.length === 0) {
    return (
      <>
        <Cabecalho titulo="Nova ordem de servico" />
        <Cartao>
          <Vazio
            titulo="Cadastre um cliente primeiro"
            descricao="Toda ordem de servico pertence a um cliente e a um veiculo."
            acao={<BotaoLink href="/clientes/novo">Cadastrar cliente</BotaoLink>}
          />
        </Cartao>
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo="Nova ordem de servico"
        descricao="Use quando o servico ja esta autorizado e nao precisa de orcamento."
      />
      <FormularioOS clientes={clientes} catalogo={catalogo} mecanicos={mecanicos} clienteInicialId={cliente} />
    </>
  );
}
