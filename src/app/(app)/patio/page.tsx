import { QuadroPatio, type CartaoOS } from "./quadro";
import { Icone } from "@/components/icones";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, placa } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Patio - Assetto" };

export default async function PaginaPatio() {
  const { oficinaId } = await exigirSessao();

  // Entregues antigas sairiam do quadro e viram historico: mostrar so as de
  // hoje mantem a coluna util sem transformar o patio num arquivo morto.
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

  const agora = new Date();
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
      os.previsaoEntrega < agora &&
      os.status !== "ENTREGUE" &&
      os.status !== "PRONTO",
  }));

  return (
    <>
      <Cabecalho
        titulo="Patio"
        descricao="Onde cada carro esta agora. Arraste o cartao ou use as setas para mudar de coluna."
        acao={
          <BotaoLink href="/os/nova">
            <Icone.mais className="h-5 w-5" />
            Nova ordem de servico
          </BotaoLink>
        }
      />

      {cartoes.length === 0 ? (
        <Cartao>
          <Vazio
            titulo="Nenhum carro no patio"
            descricao="Assim que uma ordem de servico for aberta, o carro aparece aqui."
            acao={<BotaoLink href="/os/nova">Abrir ordem de servico</BotaoLink>}
          />
        </Cartao>
      ) : (
        <QuadroPatio cartoes={cartoes} />
      )}
    </>
  );
}
