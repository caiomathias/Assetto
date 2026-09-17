import { FormularioOrcamento } from "../formulario-orcamento";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { carregarCatalogo, carregarClientes } from "@/lib/consultas";

export const metadata = { title: "Novo orcamento - Assetto" };

export default async function PaginaNovoOrcamento({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { cliente } = await searchParams;

  const [clientes, catalogo] = await Promise.all([
    carregarClientes(oficinaId),
    carregarCatalogo(oficinaId),
  ]);

  if (clientes.length === 0) {
    return (
      <>
        <Cabecalho titulo="Novo orcamento" />
        <Cartao>
          <Vazio
            titulo="Cadastre um cliente primeiro"
            descricao="Todo orcamento e feito para um cliente e um veiculo."
            acao={<BotaoLink href="/clientes/novo">Cadastrar cliente</BotaoLink>}
          />
        </Cartao>
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo="Novo orcamento"
        descricao="Monte a lista de servicos e pecas. O total e calculado sozinho."
      />
      <FormularioOrcamento clientes={clientes} catalogo={catalogo} clienteInicialId={cliente} />
    </>
  );
}
