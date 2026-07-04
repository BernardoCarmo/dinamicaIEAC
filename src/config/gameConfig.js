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
// Valores pensados para reduzir a distância entre portes (ver README).
export const TIER_BONUS = { grande: 0, medio: 0.2, pequeno: 0.45 };

// Custo (% do saldo atual do atacante) e efeito (% de corte no PIB do alvo)
// da carta de Sabotagem de PIB.
export const SABOTAGE_COST_PERCENT = 0.15;
export const SABOTAGE_GDP_CUT_PERCENT = 0.3;

// --- Definições de cartas especiais -----------------------------------------
// effectType: "zero_inflation" | "flat_bonus" | "sabotage_gdp"
const CARD_ZERO_INFLATION = {
  id: "porto_seguro_cambial",
  name: "Porto Seguro Cambial",
  effectType: "zero_inflation",
  effectText: "A inflação da rodada em que for usada é zerada e não afeta seu país.",
  narrative: "Em tempos de instabilidade, investidores buscam refúgio na sua moeda forte, que se valoriza.",
};

const CARD_MEDIO_BONUS = {
  id: "investimento_estrangeiro",
  name: "Investimento Estrangeiro Direto",
  effectType: "flat_bonus",
  effectValue: 500,
  effectText: "+500 moedas ao tesouro",
  narrative: "Uma multinacional decide investir no seu país.",
};

const CARD_PEQUENO_BONUS_1300 = {
  id: "pacote_ajuda",
  name: "Pacote de Ajuda Internacional",
  effectType: "flat_bonus",
  effectValue: 1300,
  effectText: "+1.300 moedas ao tesouro",
  narrative: "Seu país recebe um empréstimo emergencial de um organismo internacional.",
};

const CARD_PEQUENO_BONUS_900 = {
  id: "reserva_emergencia",
  name: "Reserva de Emergência",
  effectType: "flat_bonus",
  effectValue: 900,
  effectText: "+900 moedas ao tesouro",
  narrative: "Um fundo soberano libera uma reserva guardada para momentos difíceis.",
};

const CARD_SABOTAGE = {
  id: "sabotagem_pib",
  name: "Sabotagem de PIB",
  effectType: "sabotage_gdp",
  effectText: `Paga ${Math.round(SABOTAGE_COST_PERCENT * 100)}% do seu saldo atual para cortar ${Math.round(
    SABOTAGE_GDP_CUT_PERCENT * 100
  )}% do PIB que o país-alvo vai receber nesta rodada.`,
  narrative: "Uma operação de espionagem econômica sabota a produção de um país rival.",
};

// Os 6 países pré-configurados. Troque nome/bandeira/tags pelos países reais
// da sua turma antes da aula. "tier" deve ser "grande", "medio" ou "pequeno"
// (2 de cada). "themeTags" define quem é afetado por quais eventos aleatórios
// (seção 9): por exemplo, tags "commodities" e "guerra". "cards" é uma lista
// (a maioria dos países tem 1 carta; um país pequeno tem 2, ver README).
export const COUNTRIES = [
  {
    id: "c1",
    name: "China",
    flag: "🇨🇳",
    tier: "grande",
    treasuryInitial: 3000,
    gdpBase: 300,
    themeTags: [],
    cards: [CARD_ZERO_INFLATION],
  },
  {
    id: "c2",
    name: "EUA",
    flag: "🇺🇸",
    tier: "grande",
    treasuryInitial: 3000,
    gdpBase: 300,
    themeTags: [],
    cards: [CARD_ZERO_INFLATION],
  },
  {
    id: "c3",
    name: "Brasil",
    flag: "🇧🇷",
    tier: "medio",
    treasuryInitial: 2200,
    gdpBase: 200,
    themeTags: ["commodities"],
    cards: [CARD_MEDIO_BONUS],
  },
  {
    id: "c4",
    name: "Alemanha",
    flag: "🇩🇪",
    tier: "medio",
    treasuryInitial: 2200,
    gdpBase: 200,
    themeTags: [],
    cards: [CARD_MEDIO_BONUS],
  },
  {
    id: "c5",
    name: "Portugal",
    flag: "🇵🇹",
    tier: "pequeno",
    treasuryInitial: 1600,
    gdpBase: 100,
    themeTags: [],
    cards: [CARD_PEQUENO_BONUS_1300],
  },
  {
    id: "c6",
    name: "Chile",
    flag: "🇨🇱",
    tier: "pequeno",
    treasuryInitial: 1600,
    gdpBase: 100,
    themeTags: ["commodities"],
    cards: [CARD_PEQUENO_BONUS_900, CARD_SABOTAGE],
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
