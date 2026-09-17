import type { ItemCatalogo } from "@/components/editor-itens";
import type { ClienteResumo } from "@/components/seletor-cliente-veiculo";

import { salvarOS } from "./acoes";
import { EditorItens, type ItemEditavel } from "@/components/editor-itens";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { SeletorClienteVeiculo } from "@/components/seletor-cliente-veiculo";
import {
  AreaTexto,
  BotaoLink,
  Campo,
  Cartao,
  CartaoTitulo,
  Entrada,
  Selecao,
} from "@/components/ui";

export type MecanicoResumo = { id: string; nome: string };

export function FormularioOS({
  clientes,
  catalogo,
  mecanicos,
  ordem,
  clienteInicialId,
}: {
  clientes: ClienteResumo[];
  catalogo: ItemCatalogo[];
  mecanicos: MecanicoResumo[];
  clienteInicialId?: string;
  ordem?: {
    id: string;
    clienteId: string;
    veiculoId: string;
    responsavelId: string | null;
    kmEntrada: number | null;
    previsaoEntrega: string;
    descricaoProblema: string | null;
    diagnostico: string | null;
    observacoes: string | null;
    descontoCentavos: number;
    itens: ItemEditavel[];
  };
}) {
  return (
    <Formulario acao={salvarOS}>
      {ordem && <input type="hidden" name="id" value={ordem.id} />}

      <SeletorClienteVeiculo
        clientesIniciais={clientes}
        clienteInicialId={ordem?.clienteId ?? clienteInicialId}
        veiculoInicialId={ordem?.veiculoId}
        bloqueado={Boolean(ordem)}
      />

      <Cartao>
        <CartaoTitulo>Entrada do veículo</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <Campo
            rotulo="Problema relatado pelo cliente"
            ajuda="Escreva com as palavras do cliente."
            className="sm:col-span-3"
          >
            <AreaTexto
              name="descricaoProblema"
              defaultValue={ordem?.descricaoProblema ?? ""}
              placeholder="Ex: puxando para a direita quando freia"
            />
          </Campo>

          <Campo rotulo="Quilometragem na entrada">
            <Entrada
              name="kmEntrada"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={ordem?.kmEntrada ?? ""}
            />
          </Campo>

          <Campo rotulo="Previsão de entrega">
            <Entrada name="previsaoEntrega" type="date" defaultValue={ordem?.previsaoEntrega ?? ""} />
          </Campo>

          <Campo rotulo="Mecânico responsável">
            <Selecao name="responsavelId" defaultValue={ordem?.responsavelId ?? ""}>
              <option value="">Definir depois</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo
            rotulo="Diagnóstico da oficina"
            ajuda="O que o mecânico encontrou. Fica na via impressa."
            className="sm:col-span-3"
          >
            <AreaTexto
              name="diagnostico"
              defaultValue={ordem?.diagnostico ?? ""}
              placeholder="Ex: pastilhas gastas e disco empenado no lado direito"
            />
          </Campo>
        </div>
      </Cartao>

      <EditorItens
        catalogo={catalogo}
        itensIniciais={ordem?.itens}
        descontoInicial={ordem?.descontoCentavos}
      />

      <Cartao>
        <CartaoTitulo>Observações</CartaoTitulo>
        <div className="p-5">
          <Campo rotulo="Observações internas">
            <AreaTexto name="observacoes" defaultValue={ordem?.observacoes ?? ""} />
          </Campo>
        </div>
      </Cartao>

      <div className="flex flex-wrap gap-3">
        <BotaoSalvar>{ordem ? "Salvar alterações" : "Abrir ordem de serviço"}</BotaoSalvar>
        <BotaoLink
          href={ordem ? `/os/${ordem.id}` : "/patio"}
          variante="secundario"
          tamanho="grande"
        >
          Cancelar
        </BotaoLink>
      </div>
    </Formulario>
  );
}
