import { FormularioOrcamento } from "../formulario-orcamento";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { carregarCatalogo, carregarClientesIniciais } from "@/lib/consultas";

export const metadata = { title: "Novo orçamento - Assetto" };

export default async function PaginaNovoOrcamento({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { cliente } = await searchParams;

  const [clientes, catalogo] = await Promise.all([
    carregarClientesIniciais(oficinaId, cliente),
    carregarCatalogo(oficinaId),
  ]);

  if (clientes.length === 0) {
    return (
      <>
        <Cabecalho titulo="Novo orçamento" />
        <Cartao>
          <Vazio
            titulo="Cadastre um cliente primeiro"
            descricao="Todo orçamento e feito para um cliente e um veículo."
            acao={<BotaoLink href="/clientes/novo">Cadastrar cliente</BotaoLink>}
          />
        </Cartao>
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo="Novo orçamento"
        descricao="Monte a lista de serviços e peças. O total é calculado sozinho."
      />
      <FormularioOrcamento clientes={clientes} catalogo={catalogo} clienteInicialId={cliente} />
    </>
  );
}
