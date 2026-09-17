import type { ItemCatalogo } from "@/components/editor-itens";
import type { ClienteResumo } from "@/components/seletor-cliente-veiculo";

import { salvarOrcamento } from "./acoes";
import { EditorItens, type ItemEditavel } from "@/components/editor-itens";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { SeletorClienteVeiculo } from "@/components/seletor-cliente-veiculo";
import { AreaTexto, BotaoLink, Campo, Cartao, CartaoTitulo, Entrada } from "@/components/ui";

export function FormularioOrcamento({
  clientes,
  catalogo,
  orcamento,
  clienteInicialId,
}: {
  clientes: ClienteResumo[];
  catalogo: ItemCatalogo[];
  clienteInicialId?: string;
  orcamento?: {
    id: string;
    clienteId: string;
    veiculoId: string;
    validadeAte: string;
    kmAtual: number | null;
    descricaoProblema: string | null;
    observacoes: string | null;
    descontoCentavos: number;
    itens: ItemEditavel[];
  };
}) {
  // Validade padrão de 7 dias: é o prazo que a oficina consegue segurar
  // preço de peça sem se comprometer.
  const validadePadrao = new Date();
  validadePadrao.setDate(validadePadrao.getDate() + 7);
  const validadeISO = validadePadrao.toISOString().slice(0, 10);

  return (
    <Formulario acao={salvarOrcamento}>
      {orcamento && <input type="hidden" name="id" value={orcamento.id} />}

      <SeletorClienteVeiculo
        clientesIniciais={clientes}
        clienteInicialId={orcamento?.clienteId ?? clienteInicialId}
        veiculoInicialId={orcamento?.veiculoId}
        bloqueado={Boolean(orcamento)}
      />

      <Cartao>
        <CartaoTitulo>O que o cliente relatou</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <Campo
            rotulo="Problema relatado"
            ajuda="Escreva com as palavras do cliente."
            className="sm:col-span-3"
          >
            <AreaTexto
              name="descricaoProblema"
              defaultValue={orcamento?.descricaoProblema ?? ""}
              placeholder="Ex: fazendo barulho na frente quando freia"
            />
          </Campo>

          <Campo rotulo="Quilometragem">
            <Entrada
              name="kmAtual"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={orcamento?.kmAtual ?? ""}
            />
          </Campo>

          <Campo rotulo="Vale até" ajuda="Depois dessa data o preço pode mudar.">
            <Entrada
              name="validadeAte"
              type="date"
              defaultValue={orcamento?.validadeAte || validadeISO}
            />
          </Campo>
        </div>
      </Cartao>

      <EditorItens
        catalogo={catalogo}
        itensIniciais={orcamento?.itens}
        descontoInicial={orcamento?.descontoCentavos}
      />

      <Cartao>
        <CartaoTitulo>Observações</CartaoTitulo>
        <div className="p-5">
          <Campo rotulo="Observações no orçamento" ajuda="O cliente lê isso.">
            <AreaTexto
              name="observacoes"
              defaultValue={orcamento?.observacoes ?? ""}
              placeholder="Ex: valor não inclui alinhamento"
            />
          </Campo>
        </div>
      </Cartao>

      <div className="flex flex-wrap gap-3">
        <BotaoSalvar>{orcamento ? "Salvar alterações" : "Criar orçamento"}</BotaoSalvar>
        <BotaoLink
          href={orcamento ? `/orcamentos/${orcamento.id}` : "/orcamentos"}
          variante="secundario"
          tamanho="grande"
        >
          Cancelar
        </BotaoLink>
      </div>
    </Formulario>
  );
}
