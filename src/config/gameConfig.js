// ============================================================================
// CONFIGURAÇÃO DO JOGO — edite este arquivo antes da aula.
// ============================================================================
// Tudo aqui é "estático": não muda durante a partida (o que muda durante a
// partida — saldos, lances, fase atual — fica no Firebase). Troque os países,
// eventos, prêmios e a senha do mestre abaixo pelos valores reais da sua aula.
// ============================================================================

// Senha que o professor (mestre) digita para acessar o painel de controle.
export const MASTER_PASSWORD = "pringles";

// Ordem de "força" das faixas, usada para calcular a diferença de faixa na
// variável de confronto da final (seção 8 das regras).
export const TIER_ORDER = { pequeno: 0, medio: 1, grande: 2 };

// Bônus de porte fixo aplicado ao PIB de cada rodada normal (rodada 1 e 2).
// Não se aplica na rodada final (lá entra a variável de confronto).
export const TIER_BONUS = { grande: 0, medio: 0.15, pequeno: 0.3 };

// Os 6 países pré-configurados. Troque nome/bandeira/tags pelos países reais
// da sua turma antes da aula. "tier" deve ser "grande", "medio" ou "pequeno"
// (2 de cada). "themeTags" define quem é afetado por quais eventos aleatórios
// (seção 9): por exemplo, tags "commodities" e "guerra".
export const COUNTRIES = [
  {
    id: "c1",
    name: "China",
    flag: "🇨🇳",
    tier: "grande",
    treasuryInitial: 3000,
    gdpBase: 300,
    themeTags: [],
    card: {
      id: "porto_seguro_cambial",
      name: "Porto Seguro Cambial",
      effectType: "zero_inflation",
      effectText: "A inflação da rodada em que for usada é zerada e não afeta seu país.",
      narrative:
        "Em tempos de instabilidade, investidores buscam refúgio na sua moeda forte, que se valoriza.",
    },
  },
  {
    id: "c2",
    name: "EUA",
    flag: "🇺🇸",
    tier: "grande",
    treasuryInitial: 3000,
    gdpBase: 300,
    themeTags: [],
    card: {
      id: "porto_seguro_cambial",
      name: "Porto Seguro Cambial",
      effectType: "zero_inflation",
      effectText: "A inflação da rodada em que for usada é zerada e não afeta seu país.",
      narrative:
        "Em tempos de instabilidade, investidores buscam refúgio na sua moeda forte, que se valoriza.",
    },
  },
  {
    id: "c3",
    name: "Brasil",
    flag: "🇧🇷",
    tier: "medio",
    treasuryInitial: 2000,
    gdpBase: 200,
    themeTags: ["commodities"],
    card: {
      id: "investimento_estrangeiro",
      name: "Investimento Estrangeiro Direto",
      effectType: "flat_bonus",
      effectValue: 1000,
      effectText: "+1.000 moedas ao tesouro",
      narrative: "Uma multinacional decide investir pesado no seu país.",
    },
  },
  {
    id: "c4",
    name: "Alemanha",
    flag: "🇩🇪",
    tier: "medio",
    treasuryInitial: 2000,
    gdpBase: 200,
    themeTags: [],
    card: {
      id: "investimento_estrangeiro",
      name: "Investimento Estrangeiro Direto",
      effectType: "flat_bonus",
      effectValue: 1000,
      effectText: "+1.000 moedas ao tesouro",
      narrative: "Uma multinacional decide investir pesado no seu país.",
    },
  },
  {
    id: "c5",
    name: "Portugal",
    flag: "🇵🇹",
    tier: "pequeno",
    treasuryInitial: 1000,
    gdpBase: 100,
    themeTags: [],
    card: {
      id: "pacote_ajuda",
      name: "Pacote de Ajuda Internacional",
      effectType: "flat_bonus",
      effectValue: 1700,
      effectText: "+1.700 moedas ao tesouro",
      narrative: "Seu país recebe um empréstimo emergencial de um organismo internacional.",
    },
  },
  {
    id: "c6",
    name: "Chile",
    flag: "🇨🇱",
    tier: "pequeno",
    treasuryInitial: 1000,
    gdpBase: 100,
    themeTags: ["commodities"],
    card: {
      id: "pacote_ajuda",
      name: "Pacote de Ajuda Internacional",
      effectType: "flat_bonus",
      effectValue: 1700,
      effectText: "+1.700 moedas ao tesouro",
      narrative: "Seu país recebe um empréstimo emergencial de um organismo internacional.",
    },
  },
];

// Baralho de eventos aleatórios (seção 9). "type" define como o efeito é
// aplicado:
//   "all"     -> gdpPercent aplicado a todos os países
//   "tag"     -> gdpPercent aplicado só a países com a tag em "tag"
//   "random1" -> gdpPercent aplicado a 1 país sorteado no momento da revelação
//   "none"    -> nenhum efeito
// "inflationBonus" (pontos percentuais) some à inflação base da rodada, para
// todos os países, independentemente do tipo acima.
export const EVENTS = [
  {
    id: "boom_commodities",
    name: "Boom de commodities",
    type: "tag",
    tag: "commodities",
    gdpPercent: 0.2,
    inflationBonus: 0,
    description: "+20% de PIB para os países exportadores de commodities.",
  },
  {
    id: "guerra_regional",
    name: "Guerra regional",
    type: "tag",
    tag: "guerra",
    gdpPercent: -0.3,
    inflationBonus: 3,
    description:
      "-30% de PIB para os países afetados, e a inflação da rodada sobe +3 pontos percentuais para todos.",
  },
  {
    id: "inovacao_tecnologica",
    name: "Inovação tecnológica",
    type: "random1",
    gdpPercent: 0.2,
    inflationBonus: 0,
    description: "+20% de PIB apenas para um país sorteado aleatoriamente.",
  },
  {
    id: "choque_petroleo",
    name: "Choque do petróleo",
    type: "all",
    gdpPercent: -0.1,
    inflationBonus: 5,
    description:
      "-10% de PIB para todos os países, e a inflação da rodada sobe +5 pontos percentuais.",
  },
  {
    id: "estabilidade",
    name: "Estabilidade",
    type: "none",
    gdpPercent: 0,
    inflationBonus: 0,
    description: "Nenhum efeito nesta rodada.",
  },
];

// Prêmios físicos de cada etapa — troque pelo prêmio real antes da aula.
// Ficam ocultos até o mestre clicar em "revelar prêmio".
export const PRIZES = {
  r1: "Defina o prêmio físico da Rodada 1 antes da aula.",
  r2: "Defina o prêmio físico da Rodada 2 antes da aula.",
  final: "Defina o grande prêmio da Final antes da aula.",
  wealth: "Defina o prêmio do Campeão de Riqueza Real antes da aula.",
};

// Taxa de inflação base de cada rodada (pontos percentuais).
export const INFLATION_RATES = { r1: 5, r2: 8, final: 12 };

// Variável de confronto da final, de acordo com a diferença de faixa entre os
// 2 finalistas (seção 8). "randomSymmetric" sorteia +10% ou -10% igualmente
// para os dois; os outros casos dão bônus só ao finalista de faixa mais fraca.
export const CONFRONT_VARIABLE = {
  0: { type: "randomSymmetric", values: [0.1, -0.1] },
  1: { type: "weakerBonus", value: 0.15 },
  2: { type: "weakerBonus", value: 0.3 },
};

export const AUCTION_DURATION_SEC = 180;
export const FINAL_AUCTION_SILENCE_SEC = 20;
export const MIN_BID_INCREMENT = 50;

export const ROUND_KEYS = ["r1", "r2", "final"];

export const ROUND_LABELS = {
  r1: "Rodada 1",
  r2: "Rodada 2",
  final: "Final",
};
