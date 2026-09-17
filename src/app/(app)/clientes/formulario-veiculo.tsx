import type { Veiculo } from "@prisma/client";

import { salvarVeiculo } from "./acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { AreaTexto, BotaoLink, Campo, Cartao, CartaoTitulo, Entrada, Selecao } from "@/components/ui";
import { COMBUSTIVEL } from "@/lib/rotulos";

export function FormularioVeiculo({
  clienteId,
  veiculo,
}: {
  clienteId: string;
  veiculo?: Veiculo;
}) {
  const anoAtual = new Date().getFullYear();

  return (
    <Formulario acao={salvarVeiculo}>
      <input type="hidden" name="clienteId" value={clienteId} />
      {veiculo && <input type="hidden" name="id" value={veiculo.id} />}

      <Cartao>
        <CartaoTitulo>Dados do veiculo</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-6">
          <Campo rotulo="Placa" obrigatorio className="sm:col-span-2">
            <Entrada
              name="placa"
              defaultValue={veiculo?.placa}
              required
              autoFocus={!veiculo}
              maxLength={8}
              placeholder="ABC1D23"
              className="font-mono tracking-widest uppercase"
            />
          </Campo>

          <Campo rotulo="Marca" obrigatorio className="sm:col-span-2">
            <Entrada name="marca" defaultValue={veiculo?.marca} required placeholder="Fiat" />
          </Campo>

          <Campo rotulo="Modelo" obrigatorio className="sm:col-span-2">
            <Entrada name="modelo" defaultValue={veiculo?.modelo} required placeholder="Argo 1.0" />
          </Campo>

          <Campo rotulo="Ano de fabricacao" className="sm:col-span-2">
            <Entrada
              name="anoFabricacao"
              type="number"
              inputMode="numeric"
              defaultValue={veiculo?.anoFabricacao ?? ""}
              min={1900}
              max={anoAtual + 2}
              placeholder={String(anoAtual)}
            />
          </Campo>

          <Campo rotulo="Ano do modelo" className="sm:col-span-2">
            <Entrada
              name="anoModelo"
              type="number"
              inputMode="numeric"
              defaultValue={veiculo?.anoModelo ?? ""}
              min={1900}
              max={anoAtual + 2}
            />
          </Campo>

          <Campo rotulo="Cor" className="sm:col-span-2">
            <Entrada name="cor" defaultValue={veiculo?.cor ?? ""} placeholder="Prata" />
          </Campo>

          <Campo rotulo="Combustivel" className="sm:col-span-2">
            <Selecao name="combustivel" defaultValue={veiculo?.combustivel ?? "FLEX"}>
              {Object.entries(COMBUSTIVEL).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo rotulo="Quilometragem atual" className="sm:col-span-2">
            <Entrada
              name="kmAtual"
              type="number"
              inputMode="numeric"
              defaultValue={veiculo?.kmAtual ?? ""}
              min={0}
              placeholder="85000"
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <CartaoTitulo>Complemento (opcional)</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Campo rotulo="Chassi">
            <Entrada name="chassi" defaultValue={veiculo?.chassi ?? ""} maxLength={17} />
          </Campo>
          <Campo rotulo="Renavam">
            <Entrada name="renavam" defaultValue={veiculo?.renavam ?? ""} inputMode="numeric" />
          </Campo>
          <Campo
            rotulo="Observacoes"
            ajuda="Ex: 'barulho na suspensao', 'cliente pediu para nao lavar'."
            className="sm:col-span-2"
          >
            <AreaTexto name="observacoes" defaultValue={veiculo?.observacoes ?? ""} />
          </Campo>
        </div>
      </Cartao>

      <div className="flex flex-wrap gap-3">
        <BotaoSalvar>{veiculo ? "Salvar alteracoes" : "Adicionar veiculo"}</BotaoSalvar>
        <BotaoLink href={`/clientes/${clienteId}`} variante="secundario" tamanho="grande">
          Cancelar
        </BotaoLink>
      </div>
    </Formulario>
  );
}
