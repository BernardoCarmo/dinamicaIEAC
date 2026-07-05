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

// Bônus de porte fixo aplicado ao PIB de cada rodada normal (rodadas 1, 2 e 3).
// Não se aplica na rodada final (lá entra a variável de confronto).
export const TIER_BONUS = { grande: 0, medio: 0.2, pequeno: 0.45 };

// --- Cartas de ataque: custo e efeito ----------------------------------------
// Sabotagem de PIB (Chile): paga X% do próprio saldo para cortar Y% do PIB do
// alvo ESCOLHIDO nesta rodada.
export const SABOTAGE_COST_PERCENT = 0.15;
export const SABOTAGE_GDP_CUT_PERCENT = 0.3;
// Roubo de PIB (Portugal): rouba X% do PIB de um alvo SORTEADO aleatoriamente
// nesta rodada, custando um valor fixo de PIB próprio.
export const STEAL_GDP_PERCENT = 0.1;
export const STEAL_ATTACKER_PENALTY = 150;

// --- Definições de cartas especiais -----------------------------------------
// effectType: "zero_inflation" | "flat_bonus" | "sabotage_gdp" | "steal_gdp"
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

const CARD_PORTUGAL_BONUS = {
  id: "pacote_ajuda",
  name: "Pacote de Ajuda Internacional",
  effectType: "flat_bonus",
  effectValue: 900,
  effectText: "+900 moedas ao tesouro",
  narrative: "Seu país recebe um empréstimo emergencial de um organismo internacional.",
};

const CARD_CHILE_BONUS = {
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
  )}% do PIB de um país de porte grande, sorteado aleatoriamente entre eles nesta rodada.`,
  narrative: "Uma operação de espionagem econômica sabota a produção de uma das grandes potências, sorteada ao acaso.",
};

const CARD_ROUBO = {
  id: "roubo_pib",
  name: "Roubo de PIB",
  effectType: "steal_gdp",
  effectText: `Rouba ${Math.round(
    STEAL_GDP_PERCENT * 100
  )}% do PIB de um país escolhido por você nesta rodada, mas custa ${STEAL_ATTACKER_PENALTY} de PIB próprio.`,
  narrative: "Um esquema de contrabando desvia parte da produção de um país vizinho escolhido a dedo.",
};

// Os 6 países pré-configurados. Troque nome/bandeira/tags pelos países reais
// da sua turma antes da aula. "tier" deve ser "grande", "medio" ou "pequeno"
// (2 de cada). "themeTags" define quem é afetado por quais eventos aleatórios
// (seção 9): por exemplo, tags "commodities" e "guerra". "cards" é uma lista
// (a maioria dos países tem 1 carta; os 2 países pequenos têm 2 cada: um bônus
// fixo + uma carta de ataque única — Sabotagem sorteia o alvo, Roubo escolhe).
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
    treasuryInitial: 2500,
    gdpBase: 200,
    themeTags: ["commodities"],
    cards: [CARD_MEDIO_BONUS],
  },
  {
    id: "c4",
    name: "Alemanha",
    flag: "🇩🇪",
    tier: "medio",
    treasuryInitial: 2500,
    gdpBase: 200,
    themeTags: [],
    cards: [CARD_MEDIO_BONUS],
  },
  {
    id: "c5",
    name: "Portugal",
    flag: "🇵🇹",
    tier: "pequeno",
    treasuryInitial: 2000,
    gdpBase: 100,
    themeTags: [],
    cards: [CARD_PORTUGAL_BONUS, CARD_ROUBO],
  },
  {
    id: "c6",
    name: "Chile",
    flag: "🇨🇱",
    tier: "pequeno",
    treasuryInitial: 2000,
    gdpBase: 100,
    themeTags: ["commodities"],
    cards: [CARD_CHILE_BONUS, CARD_SABOTAGE],
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
  r3: "Defina o prêmio físico da Rodada 3 antes da aula.",
  final: "Defina o grande prêmio da Final antes da aula.",
  wealth: "Defina o prêmio do Campeão de Riqueza Real antes da aula.",
};

// Taxa de inflação base de cada rodada (pontos percentuais).
export const INFLATION_RATES = { r1: 5, r2: 7, r3: 9, final: 12 };

// Punição extra de inflação ligada ao resultado do leilão daquela rodada:
// quem venceu não paga nada a mais; quem fez o 2º maior lance (arriscou e não
// levou) paga bem mais; os demais pagam um pouco mais. Não se aplica a quem
// estiver isento por carta (Porto Seguro Cambial).
export const NON_WINNER_INFLATION_EXTRA = 1;
export const SECOND_PLACE_INFLATION_EXTRA = 3;

// Variável de confronto da final, de acordo com a diferença de faixa entre os
// 2 finalistas (seção 8). "randomSymmetric" sorteia +10% ou -10% igualmente
// para os dois; os outros casos dão bônus só ao finalista de faixa mais fraca.
export const CONFRONT_VARIABLE = {
  0: { type: "randomSymmetric", values: [0.1, -0.1] },
  1: { type: "weakerBonus", value: 0.15 },
  2: { type: "weakerBonus", value: 0.3 },
};

// --- Leilão -------------------------------------------------------------------
// Todas as rodadas (1, 2, 3 e final) têm 1 minuto fixo de negociação, sem
// prorrogação, com 2 fases (mesma regra pra rodadas normais e final):
//   1) "Às cegas" — enquanto restar mais que BLIND_PHASE_END_REMAINING_SEC:
//      cada país pode dar 1 único lance selado, a qualquer momento dessa
//      janela. Assim que um país dá esse lance, ELE (só ele) fica travado até
//      a revelação — quem ainda não apostou NUNCA fica travado, pode esperar
//      à vontade.
//   2) "Revelado" — a partir de BLIND_PHASE_END_REMAINING_SEC restantes: os
//      valores de todos os lances aparecem, e todo mundo (travado ou não)
//      pode voltar a dar lances de verdade (precisa superar o maior atual).
export const AUCTION_DURATION_SEC = 60;
export const BLIND_PHASE_END_REMAINING_SEC = 20;
export const MIN_BID_INCREMENT = 50;
// Intervalo mínimo entre 2 lances do mesmo país, pra evitar clique repetido.
export const BID_COOLDOWN_MS = 1000;

export const ROUND_KEYS = ["r1", "r2", "r3", "final"];
export const PRELIMINARY_ROUND_KEYS = ["r1", "r2", "r3"];
// Nenhum país pode vencer mais que esse número de rodadas normais — quem
// bate esse limite já garante vaga na final (com no máximo 3 rodadas
// preliminares, no máximo 1 país consegue atingir 2 vitórias).
export const MAX_PRELIMINARY_WINS = 2;

export const ROUND_LABELS = {
  r1: "Rodada 1",
  r2: "Rodada 2",
  r3: "Rodada 3",
  final: "Final",
};
