import { QuadroPatio, type CartaoOS } from "./quadro";
import { Icone } from "@/components/icones";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, placa } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Pátio - Assetto" };

export default async function PaginaPatio() {
  const { oficinaId } = await exigirSessao();

  // Entregues antigas sairiam do quadro e viram histórico: mostrar só as de
  // hoje mantém a coluna útil sem transformar o pátio num arquivo morto.
  const inicioDeHoje = new Date();
  inicioDeHoje.setHours(0, 0, 0, 0);

  const ordens = await prisma.ordemServico.findMany({
    where: {
      oficinaId,
      OR: [
        { status: { in: ["RECEBIDO", "AGUARDANDO_APROVACAO", "EM_EXECUCAO", "AGUARDANDO_PECA", "PRONTO"] } },
        { status: "ENTREGUE", entregueEm: { gte: inicioDeHoje } },
      ],
    },
    include: { cliente: true, veiculo: true, responsavel: true },
    orderBy: { criadoEm: "asc" },
  });

  const cartoes: CartaoOS[] = ordens.map((os) => ({
    id: os.id,
    numero: os.numero,
    status: os.status,
    cliente: os.cliente.nome,
    placa: placa(os.veiculo.placa),
    veiculo: `${os.veiculo.marca} ${os.veiculo.modelo}`,
    responsavel: os.responsavel?.nome.split(" ")[0] ?? null,
    totalCentavos: os.totalCentavos,
    previsaoEntrega: os.previsaoEntrega ? data(os.previsaoEntrega) : null,
    atrasada:
      os.previsaoEntrega !== null &&
      os.previsaoEntrega < inicioDeHoje &&
      os.status !== "ENTREGUE" &&
      os.status !== "PRONTO",
  }));

  return (
    <>
      <Cabecalho
        titulo="Pátio"
        descricao="Onde cada carro está agora. Arraste o cartão ou use as setas para mudar de coluna."
        acao={
          <BotaoLink href="/os/nova">
            <Icone.mais className="h-5 w-5" />
            Nova ordem de serviço
          </BotaoLink>
        }
      />

      {cartoes.length === 0 ? (
        <Cartao>
          <Vazio
            titulo="Nenhum carro no pátio"
            descricao="Assim que uma ordem de serviço for aberta, o carro aparece aqui."
            acao={<BotaoLink href="/os/nova">Abrir ordem de serviço</BotaoLink>}
          />
        </Cartao>
      ) : (
        <QuadroPatio cartoes={cartoes} />
      )}
    </>
  );
}
