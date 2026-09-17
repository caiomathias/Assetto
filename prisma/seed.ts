/**
 * Dados de demonstração.
 *
 * Serve para abrir o sistema e ver todas as telas cheias sem ter que digitar
 * nada. Roda com `npm run db:seed`. Não usar em produção: a senha e conhecida.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL_DEMO = "demo@assetto.com.br";
const SENHA_DEMO = "assetto123";

function reais(valor: number): number {
  return Math.round(valor * 100);
}

function diasAtras(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

function diasAFrente(dias: number): Date {
  return diasAtras(-dias);
}

async function main() {
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL_DEMO } });
  if (existente) {
    await prisma.oficina.delete({ where: { id: existente.oficinaId } });
    console.log("Oficina de demonstração anterior removida.");
  }

  const oficina = await prisma.oficina.create({
    data: {
      nome: "Auto Center Modelo",
      cnpj: "12345678000190",
      telefone: "1133224455",
      email: "contato@autocentermodelo.com.br",
      cep: "01310100",
      endereco: "Avenida Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      plano: "PROFISSIONAL",
    },
  });

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);

  const dono = await prisma.usuario.create({
    data: {
      oficinaId: oficina.id,
      nome: "Carlos Oliveira",
      email: EMAIL_DEMO,
      senhaHash,
      papel: "DONO",
    },
  });

  const mecanico = await prisma.usuario.create({
    data: {
      oficinaId: oficina.id,
      nome: "José Santos",
      email: "jose@autocentermodelo.com.br",
      senhaHash,
      papel: "MECANICO",
    },
  });

  await prisma.usuario.create({
    data: {
      oficinaId: oficina.id,
      nome: "Ana Lima",
      email: "ana@autocentermodelo.com.br",
      senhaHash,
      papel: "ATENDENTE",
    },
  });

  // --- Catalogo -----------------------------------------------------------

  const servicosBase = [
    { nome: "Troca de óleo e filtro", preco: 90, tempo: 30 },
    { nome: "Alinhamento e balanceamento", preco: 150, tempo: 60 },
    { nome: "Troca de pastilhas de freio", preco: 180, tempo: 60 },
    { nome: "Revisão completa", preco: 450, tempo: 180 },
    { nome: "Troca de correia dentada", preco: 600, tempo: 240 },
    { nome: "Diagnóstico eletrônico (scanner)", preco: 120, tempo: 45 },
  ];

  const servicos = await Promise.all(
    servicosBase.map((s) =>
      prisma.servico.create({
        data: {
          oficinaId: oficina.id,
          nome: s.nome,
          precoCentavos: reais(s.preco),
          tempoEstimadoMin: s.tempo,
        },
      }),
    ),
  );

  const pecasBase = [
    { nome: "Óleo motor 5W30 sintético", codigo: "OL-5W30", marca: "Mobil", unidade: "L", custo: 32, venda: 55, qtd: 24, min: 12 },
    { nome: "Filtro de óleo", codigo: "FO-102", marca: "Tecfil", unidade: "UN", custo: 18, venda: 38, qtd: 15, min: 5 },
    { nome: "Filtro de ar", codigo: "FA-220", marca: "Tecfil", unidade: "UN", custo: 25, venda: 52, qtd: 8, min: 4 },
    { nome: "Pastilha de freio dianteira", codigo: "PF-330", marca: "Bosch", unidade: "JG", custo: 95, venda: 190, qtd: 6, min: 3 },
    { nome: "Disco de freio dianteiro", codigo: "DF-450", marca: "Fremax", unidade: "UN", custo: 120, venda: 240, qtd: 2, min: 4 },
    { nome: "Correia dentada", codigo: "CD-880", marca: "Gates", unidade: "UN", custo: 140, venda: 280, qtd: 3, min: 2 },
    { nome: "Vela de ignição", codigo: "VI-055", marca: "NGK", unidade: "UN", custo: 22, venda: 45, qtd: 20, min: 8 },
    { nome: "Bateria 60Ah", codigo: "BT-60", marca: "Moura", unidade: "UN", custo: 380, venda: 620, qtd: 1, min: 2 },
  ];

  const pecas = await Promise.all(
    pecasBase.map(async (p) => {
      const peca = await prisma.peca.create({
        data: {
          oficinaId: oficina.id,
          nome: p.nome,
          codigo: p.codigo,
          marca: p.marca,
          unidade: p.unidade,
          precoCustoCentavos: reais(p.custo),
          precoVendaCentavos: reais(p.venda),
          quantidade: p.qtd,
          estoqueMinimo: p.min,
        },
      });

      await prisma.movimentoEstoque.create({
        data: {
          oficinaId: oficina.id,
          pecaId: peca.id,
          tipo: "ENTRADA",
          quantidade: p.qtd,
          saldoDepois: p.qtd,
          motivo: "Estoque inicial",
          usuarioId: dono.id,
          criadoEm: diasAtras(40),
        },
      });

      return peca;
    }),
  );

  const acharPeca = (codigo: string) => pecas.find((p) => p.codigo === codigo)!;
  const acharServico = (inicio: string) => servicos.find((s) => s.nome.startsWith(inicio))!;

  // --- Clientes e veículos ------------------------------------------------

  const clientesBase = [
    {
      nome: "Maria Aparecida Souza",
      telefone: "11987654321",
      documento: "12345678901",
      veiculo: { placa: "ABC1D23", marca: "Fiat", modelo: "Argo 1.0", ano: 2021, cor: "Prata", km: 42000 },
    },
    {
      nome: "João Pedro Almeida",
      telefone: "11976543210",
      documento: "23456789012",
      veiculo: { placa: "DEF4G56", marca: "Volkswagen", modelo: "Gol 1.6", ano: 2018, cor: "Branco", km: 95000 },
    },
    {
      nome: "Transportes Silva ME",
      telefone: "1133445566",
      documento: "98765432000188",
      tipoPessoa: "JURIDICA" as const,
      veiculo: { placa: "GHI7J89", marca: "Chevrolet", modelo: "Onix 1.0", ano: 2022, cor: "Preto", km: 28000 },
    },
    {
      nome: "Fernanda Costa",
      telefone: "11965432109",
      documento: "34567890123",
      veiculo: { placa: "JKL0M12", marca: "Hyundai", modelo: "HB20 1.0", ano: 2020, cor: "Vermelho", km: 55000 },
    },
    {
      nome: "Roberto Mendes",
      telefone: "11954321098",
      documento: "45678901234",
      veiculo: { placa: "NOP3Q45", marca: "Toyota", modelo: "Corolla 2.0", ano: 2019, cor: "Cinza", km: 78000 },
    },
    {
      nome: "Patrícia Nunes",
      telefone: "11943210987",
      documento: "56789012345",
      veiculo: { placa: "RST6U78", marca: "Honda", modelo: "Civic 2.0", ano: 2017, cor: "Azul", km: 112000 },
    },
  ];

  const clientes = await Promise.all(
    clientesBase.map(async (c) => {
      const cliente = await prisma.cliente.create({
        data: {
          oficinaId: oficina.id,
          nome: c.nome,
          telefone: c.telefone,
          documento: c.documento,
          tipoPessoa: c.tipoPessoa ?? "FISICA",
          cidade: "São Paulo",
          uf: "SP",
        },
      });

      const veiculo = await prisma.veiculo.create({
        data: {
          oficinaId: oficina.id,
          clienteId: cliente.id,
          placa: c.veiculo.placa,
          marca: c.veiculo.marca,
          modelo: c.veiculo.modelo,
          anoFabricacao: c.veiculo.ano,
          anoModelo: c.veiculo.ano,
          cor: c.veiculo.cor,
          kmAtual: c.veiculo.km,
        },
      });

      return { cliente, veiculo };
    }),
  );

  // --- Numeração ----------------------------------------------------------

  let proximoOrcamento = 0;
  let proximaOS = 0;

  // --- Orçamentos ---------------------------------------------------------

  type LinhaItem = {
    tipo: "PECA" | "SERVICO";
    descricao: string;
    quantidade: number;
    valor: number;
    pecaId?: string;
    servicoId?: string;
  };

  const montar = (itens: LinhaItem[]) =>
    itens.map((item, ordem) => ({
      tipo: item.tipo,
      pecaId: item.pecaId ?? null,
      servicoId: item.servicoId ?? null,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valorUnitCentavos: reais(item.valor),
      totalCentavos: Math.round(item.quantidade * reais(item.valor)),
      ordem,
    }));

  const somar = (itens: ReturnType<typeof montar>) =>
    itens.reduce((s, i) => s + i.totalCentavos, 0);

  const orcamentoFreio = montar([
    {
      tipo: "SERVICO",
      descricao: "Troca de pastilhas de freio",
      quantidade: 1,
      valor: 180,
      servicoId: acharServico("Troca de pastilhas").id,
    },
    {
      tipo: "PECA",
      descricao: "Pastilha de freio dianteira (PF-330)",
      quantidade: 1,
      valor: 190,
      pecaId: acharPeca("PF-330").id,
    },
    {
      tipo: "PECA",
      descricao: "Disco de freio dianteiro (DF-450)",
      quantidade: 2,
      valor: 240,
      pecaId: acharPeca("DF-450").id,
    },
  ]);

  await prisma.orcamento.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximoOrcamento,
      clienteId: clientes[3].cliente.id,
      veiculoId: clientes[3].veiculo.id,
      status: "ENVIADO",
      enviadoEm: diasAtras(1),
      validadeAte: diasAFrente(6),
      kmAtual: 55000,
      descricaoProblema: "Barulho de metal quando pisa no freio, principalmente de manhã.",
      observacoes: "Valor não inclui troca do fluido de freio.",
      totalCentavos: somar(orcamentoFreio),
      criadoPorId: dono.id,
      criadoEm: diasAtras(1),
      itens: { create: orcamentoFreio },
    },
  });

  const orcamentoCorreia = montar([
    {
      tipo: "SERVICO",
      descricao: "Troca de correia dentada",
      quantidade: 1,
      valor: 600,
      servicoId: acharServico("Troca de correia").id,
    },
    {
      tipo: "PECA",
      descricao: "Correia dentada (CD-880)",
      quantidade: 1,
      valor: 280,
      pecaId: acharPeca("CD-880").id,
    },
  ]);

  await prisma.orcamento.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximoOrcamento,
      clienteId: clientes[5].cliente.id,
      veiculoId: clientes[5].veiculo.id,
      status: "RECUSADO",
      enviadoEm: diasAtras(8),
      respondidoEm: diasAtras(6),
      respondidoPor: "Cliente (pelo link)",
      motivoRecusa: "Valor acima do esperado, vai pesquisar.",
      validadeAte: diasAtras(1),
      totalCentavos: somar(orcamentoCorreia),
      criadoPorId: dono.id,
      criadoEm: diasAtras(8),
      itens: { create: orcamentoCorreia },
    },
  });

  const orcamentoRevisao = montar([
    {
      tipo: "SERVICO",
      descricao: "Revisão completa",
      quantidade: 1,
      valor: 450,
      servicoId: acharServico("Revisão completa").id,
    },
    {
      tipo: "PECA",
      descricao: "Óleo motor 5W30 sintético (OL-5W30)",
      quantidade: 4,
      valor: 55,
      pecaId: acharPeca("OL-5W30").id,
    },
    {
      tipo: "PECA",
      descricao: "Filtro de óleo (FO-102)",
      quantidade: 1,
      valor: 38,
      pecaId: acharPeca("FO-102").id,
    },
  ]);

  await prisma.orcamento.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximoOrcamento,
      clienteId: clientes[4].cliente.id,
      veiculoId: clientes[4].veiculo.id,
      status: "APROVADO",
      enviadoEm: diasAtras(2),
      respondidoEm: diasAtras(1),
      respondidoPor: "Roberto Mendes (pelo link)",
      validadeAte: diasAFrente(5),
      descricaoProblema: "Revisão dos 80 mil km.",
      totalCentavos: somar(orcamentoRevisao),
      criadoPorId: dono.id,
      criadoEm: diasAtras(2),
      itens: { create: orcamentoRevisao },
    },
  });

  // --- Ordens de serviço --------------------------------------------------

  const osTrocaOleo = montar([
    {
      tipo: "SERVICO",
      descricao: "Troca de óleo e filtro",
      quantidade: 1,
      valor: 90,
      servicoId: acharServico("Troca de óleo").id,
    },
    {
      tipo: "PECA",
      descricao: "Óleo motor 5W30 sintético (OL-5W30)",
      quantidade: 4,
      valor: 55,
      pecaId: acharPeca("OL-5W30").id,
    },
    {
      tipo: "PECA",
      descricao: "Filtro de óleo (FO-102)",
      quantidade: 1,
      valor: 38,
      pecaId: acharPeca("FO-102").id,
    },
  ]);

  await prisma.ordemServico.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximaOS,
      clienteId: clientes[0].cliente.id,
      veiculoId: clientes[0].veiculo.id,
      status: "EM_EXECUCAO",
      responsavelId: mecanico.id,
      kmEntrada: 42000,
      previsaoEntrega: diasAFrente(1),
      descricaoProblema: "Cliente pediu a troca de óleo da revisão.",
      diagnostico: "Óleo escuro, filtro saturado. Demais itens em ordem.",
      totalCentavos: somar(osTrocaOleo),
      iniciadoEm: diasAtras(0),
      itens: { create: osTrocaOleo },
    },
  });

  const osEletrica = montar([
    {
      tipo: "SERVICO",
      descricao: "Diagnóstico eletrônico (scanner)",
      quantidade: 1,
      valor: 120,
      servicoId: acharServico("Diagnóstico eletrônico").id,
    },
    {
      tipo: "PECA",
      descricao: "Bateria 60Ah (BT-60)",
      quantidade: 1,
      valor: 620,
      pecaId: acharPeca("BT-60").id,
    },
  ]);

  await prisma.ordemServico.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximaOS,
      clienteId: clientes[1].cliente.id,
      veiculoId: clientes[1].veiculo.id,
      status: "AGUARDANDO_PECA",
      responsavelId: mecanico.id,
      kmEntrada: 95000,
      previsaoEntrega: diasAtras(1),
      descricaoProblema: "Carro não pega de manhã.",
      diagnostico: "Bateria sem carga e sem retenção. Alternador está bom.",
      observacoes: "Aguardando chegar a bateria do fornecedor.",
      totalCentavos: somar(osEletrica),
      iniciadoEm: diasAtras(2),
      itens: { create: osEletrica },
    },
  });

  const osAlinhamento = montar([
    {
      tipo: "SERVICO",
      descricao: "Alinhamento e balanceamento",
      quantidade: 1,
      valor: 150,
      servicoId: acharServico("Alinhamento").id,
    },
  ]);

  await prisma.ordemServico.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximaOS,
      clienteId: clientes[2].cliente.id,
      veiculoId: clientes[2].veiculo.id,
      status: "PRONTO",
      responsavelId: mecanico.id,
      kmEntrada: 28000,
      descricaoProblema: "Volante tremendo acima de 80 km/h.",
      totalCentavos: somar(osAlinhamento),
      iniciadoEm: diasAtras(1),
      finalizadoEm: diasAtras(0),
      itens: { create: osAlinhamento },
    },
  });

  await prisma.ordemServico.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximaOS,
      clienteId: clientes[3].cliente.id,
      veiculoId: clientes[3].veiculo.id,
      status: "RECEBIDO",
      kmEntrada: 55000,
      descricaoProblema: "Barulho no freio. Aguardando aprovação do orçamento.",
      totalCentavos: 0,
      criadoEm: diasAtras(0),
      itens: { create: [] },
    },
  });

  // OS já faturada: gera receita no financeiro e saída de estoque.
  const osFaturada = montar([
    {
      tipo: "SERVICO",
      descricao: "Revisão completa",
      quantidade: 1,
      valor: 450,
      servicoId: acharServico("Revisão completa").id,
    },
    {
      tipo: "PECA",
      descricao: "Filtro de ar (FA-220)",
      quantidade: 1,
      valor: 52,
      pecaId: acharPeca("FA-220").id,
    },
    {
      tipo: "PECA",
      descricao: "Vela de ignição (VI-055)",
      quantidade: 4,
      valor: 45,
      pecaId: acharPeca("VI-055").id,
    },
  ]);

  const totalFaturada = somar(osFaturada);

  const ordemFaturada = await prisma.ordemServico.create({
    data: {
      oficinaId: oficina.id,
      numero: ++proximaOS,
      clienteId: clientes[5].cliente.id,
      veiculoId: clientes[5].veiculo.id,
      status: "ENTREGUE",
      responsavelId: mecanico.id,
      kmEntrada: 112000,
      descricaoProblema: "Revisão dos 110 mil km.",
      totalCentavos: totalFaturada,
      estoqueBaixado: true,
      iniciadoEm: diasAtras(12),
      finalizadoEm: diasAtras(11),
      entregueEm: diasAtras(11),
      criadoEm: diasAtras(12),
      itens: { create: osFaturada },
    },
  });

  for (const [codigo, quantidade] of [
    ["FA-220", 1],
    ["VI-055", 4],
  ] as const) {
    const peca = acharPeca(codigo);
    const saldo = peca.quantidade - quantidade;
    await prisma.peca.update({ where: { id: peca.id }, data: { quantidade: saldo } });
    await prisma.movimentoEstoque.create({
      data: {
        oficinaId: oficina.id,
        pecaId: peca.id,
        tipo: "SAIDA",
        quantidade,
        saldoDepois: saldo,
        motivo: `Uso na OS ${String(ordemFaturada.numero).padStart(4, "0")}`,
        ordemServicoId: ordemFaturada.id,
        usuarioId: dono.id,
        criadoEm: diasAtras(11),
      },
    });
  }

  // --- Financeiro ---------------------------------------------------------

  await prisma.lancamento.create({
    data: {
      oficinaId: oficina.id,
      tipo: "RECEITA",
      categoria: "Serviço / OS",
      descricao: `OS ${String(ordemFaturada.numero).padStart(4, "0")}`,
      valorCentavos: totalFaturada,
      vencimento: diasAtras(11),
      pagoEm: diasAtras(11),
      formaPagamento: "PIX",
      ordemServicoId: ordemFaturada.id,
      clienteId: clientes[5].cliente.id,
    },
  });

  const despesas = [
    { categoria: "Aluguel", descricao: "Aluguel do galpão", valor: 4500, dias: 10, pago: true },
    { categoria: "Salários", descricao: "Folha da equipe", valor: 9800, dias: 5, pago: true },
    { categoria: "Água / Luz / Internet", descricao: "Energia elétrica", valor: 890, dias: 3, pago: true },
    { categoria: "Compra de peças", descricao: "Pedido Auto Peças Silva", valor: 2350, dias: -5, pago: false },
    { categoria: "Impostos", descricao: "Simples Nacional", valor: 1250, dias: -12, pago: false },
  ];

  for (const d of despesas) {
    await prisma.lancamento.create({
      data: {
        oficinaId: oficina.id,
        tipo: "DESPESA",
        categoria: d.categoria,
        descricao: d.descricao,
        valorCentavos: reais(d.valor),
        vencimento: diasAtras(d.dias),
        pagoEm: d.pago ? diasAtras(d.dias) : null,
        formaPagamento: d.pago ? "TRANSFERENCIA" : null,
      },
    });
  }

  await prisma.lancamento.create({
    data: {
      oficinaId: oficina.id,
      tipo: "RECEITA",
      categoria: "Venda de peça",
      descricao: "Venda de óleo no balcão",
      valorCentavos: reais(220),
      vencimento: diasAtras(4),
      pagoEm: diasAtras(4),
      formaPagamento: "DINHEIRO",
    },
  });

  // --- CRM ----------------------------------------------------------------

  const oportunidades = [
    { nome: "Lucas Ferreira", telefone: "11991112222", origem: "Instagram", etapa: "NOVO" as const, valor: 800, contato: 0, obs: "Viu o post de suspensão, quer orçamento para Onix 2019." },
    { nome: "Camila Rocha", telefone: "11992223333", origem: "Indicação", etapa: "CONTATO_FEITO" as const, valor: 1500, contato: 1, obs: "Indicada pela Maria. Embreagem patinando." },
    { nome: "Frota Rápida Entregas", telefone: "1133339999", origem: "Google", etapa: "NEGOCIACAO" as const, valor: 6800, contato: 2, obs: "Quer contrato de manutenção para 5 carros. Pediu desconto." },
    { nome: "Patrícia Nunes", telefone: "11943210987", origem: "Cliente antigo", etapa: "ORCAMENTO_ENVIADO" as const, valor: 880, contato: -1, obs: "Recusou a correia. Tentar de novo com parcelamento." },
    { nome: "Diego Martins", telefone: "11994445555", origem: "Passou na frente", etapa: "GANHO" as const, valor: 450, contato: null, obs: "Fechou a revisão completa." },
  ];

  for (const o of oportunidades) {
    await prisma.oportunidade.create({
      data: {
        oficinaId: oficina.id,
        nomeContato: o.nome,
        telefone: o.telefone,
        origem: o.origem,
        etapa: o.etapa,
        valorEstimadoCentavos: reais(o.valor),
        proximoContatoEm: o.contato === null ? null : diasAtras(o.contato),
        observacoes: o.obs,
        responsavelId: dono.id,
        fechadoEm: o.etapa === "GANHO" ? diasAtras(3) : null,
      },
    });
  }

  // --- Sequencias ---------------------------------------------------------

  await prisma.sequencia.createMany({
    data: [
      { oficinaId: oficina.id, tipo: "ORCAMENTO", valor: proximoOrcamento },
      { oficinaId: oficina.id, tipo: "ORDEM_SERVICO", valor: proximaOS },
    ],
  });

  console.log("\nDados de demonstração criados.");
  console.log(`  Oficina: ${oficina.nome}`);
  console.log(`  Entrar com: ${EMAIL_DEMO}`);
  console.log(`  Senha:      ${SENHA_DEMO}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
