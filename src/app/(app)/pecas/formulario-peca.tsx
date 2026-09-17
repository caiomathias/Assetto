import type { Peca } from "@prisma/client";

import { salvarPeca } from "./acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { BotaoLink, Campo, Cartao, CartaoTitulo, Entrada, Selecao } from "@/components/ui";
import { moedaSimples, quantidade as formatarQtd } from "@/lib/format";

const UNIDADES = ["UN", "PC", "L", "KG", "M", "CX", "JG"];

export function FormularioPeca({ peca }: { peca?: Peca }) {
  return (
    <Formulario acao={salvarPeca}>
      {peca && <input type="hidden" name="id" value={peca.id} />}

      <Cartao>
        <CartaoTitulo>Identificação</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-6">
          <Campo rotulo="Nome da peça" obrigatorio className="sm:col-span-4">
            <Entrada
              name="nome"
              defaultValue={peca?.nome}
              required
              autoFocus
              placeholder="Pastilha de freio dianteira"
            />
          </Campo>

          <Campo rotulo="Código / referência" className="sm:col-span-2">
            <Entrada name="codigo" defaultValue={peca?.codigo ?? ""} placeholder="FR-1234" />
          </Campo>

          <Campo rotulo="Marca" className="sm:col-span-2">
            <Entrada name="marca" defaultValue={peca?.marca ?? ""} placeholder="Bosch" />
          </Campo>

          <Campo rotulo="Unidade" className="sm:col-span-2">
            <Selecao name="unidade" defaultValue={peca?.unidade ?? "UN"}>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo
            rotulo="Onde fica guardada"
            ajuda="Ex: prateleira A3"
            className="sm:col-span-2"
          >
            <Entrada name="localizacao" defaultValue={peca?.localizacao ?? ""} />
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <CartaoTitulo>Preços e estoque</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-4">
          <Campo rotulo="Preço de custo (R$)" ajuda="Quanto você paga ao fornecedor.">
            <Entrada
              name="precoCusto"
              inputMode="decimal"
              defaultValue={peca ? moedaSimples(peca.precoCustoCentavos) : "0,00"}
            />
          </Campo>

          <Campo rotulo="Preço de venda (R$)" ajuda="Quanto o cliente paga.">
            <Entrada
              name="precoVenda"
              inputMode="decimal"
              defaultValue={peca ? moedaSimples(peca.precoVendaCentavos) : "0,00"}
            />
          </Campo>

          <Campo rotulo="Estoque mínimo" ajuda="Abaixo disso o sistema avisa.">
            <Entrada
              name="estoqueMinimo"
              inputMode="decimal"
              defaultValue={peca ? formatarQtd(peca.estoqueMinimo) : "0"}
            />
          </Campo>

          {peca ? (
            <Campo rotulo="Quantidade atual" ajuda="Só muda por entrada, saída ou acerto.">
              <Entrada value={`${formatarQtd(peca.quantidade)} ${peca.unidade}`} disabled readOnly />
            </Campo>
          ) : (
            <Campo rotulo="Quantidade inicial" ajuda="Quanto você tem hoje na prateleira.">
              <Entrada name="quantidade" inputMode="decimal" defaultValue="0" />
            </Campo>
          )}
        </div>
      </Cartao>

      <div className="flex flex-wrap gap-3">
        <BotaoSalvar>{peca ? "Salvar alterações" : "Cadastrar peça"}</BotaoSalvar>
        <BotaoLink href="/pecas" variante="secundario" tamanho="grande">
          Cancelar
        </BotaoLink>
      </div>
    </Formulario>
  );
}
