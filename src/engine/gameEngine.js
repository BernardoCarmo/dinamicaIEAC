// ============================================================================
// MOTOR DE REGRAS — funções puras (sem efeitos colaterais, sem Firebase).
// Só o cliente do mestre chama estas funções; o resultado é gravado no
// Firebase por src/engine/firebaseActions.js. Mantendo os cálculos aqui,
// puros e testáveis, evitamos que o professor precise calcular nada na mão.
// ============================================================================
import {
  COUNTRIES,
  EVENTS,
  TIER_BONUS,
  TIER_ORDER,
  CONFRONT_VARIABLE,
  SABOTAGE_GDP_CUT_PERCENT,
  STEAL_GDP_PERCENT,
  STEAL_ATTACKER_PENALTY,
  PRELIMINARY_ROUND_KEYS,
  FIXED_BET_UNTIL_REMAINING_SEC,
  NEW_BIDS_FROM_REMAINING_SEC,
  VALUES_REVEAL_FROM_REMAINING_SEC,
  NON_WINNER_INFLATION_EXTRA,
  SECOND_PLACE_INFLATION_EXTRA,
} from "../config/gameConfig";

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function countryById(id) {
  return COUNTRIES.find((c) => c.id === id);
}

// --- Sorteio inicial de países -------------------------------------------
export function drawCountryAssignment(leaderIds) {
  const shuffledCountries = shuffle(COUNTRIES.map((c) => c.id));
  const assignment = {};
  leaderIds.forEach((leaderId, idx) => {
    assignment[shuffledCountries[idx]] = leaderId;
  });
  return assignment;
}

// --- Sorteio de evento ------------------------------------------------------
export function drawEvent() {
  const event = shuffle(EVENTS)[0];
  const drawn = { ...event };
  if (event.type === "random1") {
    const target = shuffle(COUNTRIES.map((c) => c.id))[0];
    drawn.randomTargetCountryId = target;
  }
  return drawn;
}

// --- Variável de confronto (só na final) ------------------------------------
export function computeConfrontVariable(finalistIds) {
  const [id1, id2] = finalistIds;
  const c1 = countryById(id1);
  const c2 = countryById(id2);
  const diff = Math.abs(TIER_ORDER[c1.tier] - TIER_ORDER[c2.tier]);
  const rule = CONFRONT_VARIABLE[diff];

  const perCountry = {};
  if (rule.type === "randomSymmetric") {
    const value = shuffle(rule.values)[0];
    perCountry[id1] = value;
    perCountry[id2] = value;
  } else {
    // weakerBonus: quem tem menor TIER_ORDER é o mais fraco
    const weakerId = TIER_ORDER[c1.tier] <= TIER_ORDER[c2.tier] ? id1 : id2;
    const strongerId = weakerId === id1 ? id2 : id1;
    perCountry[weakerId] = rule.value;
    perCountry[strongerId] = 0;
  }
  return { diff, type: rule.type, perCountry };
}

// --- Cálculo do PIB da rodada ------------------------------------------------
// roundKey: 'r1' | 'r2' | 'r3' | 'final'
// event: objeto retornado por drawEvent()
// finalists: [id, id] (apenas relevante quando roundKey === 'final')
// confront: resultado de computeConfrontVariable (apenas na final)
// sabotage: { attackerId, targetId } se alguém usou a carta de Sabotagem de PIB
// theft: { attackerId, targetId } se alguém usou a carta de Roubo de PIB
export function computeGdpForRound({ roundKey, event, finalists, confront, sabotage, theft }) {
  const gdpAmounts = {};
  const isFinal = roundKey === "final";

  for (const country of COUNTRIES) {
    const isFinalist = isFinal && finalists?.includes(country.id);

    const structuralBonus = isFinal
      ? isFinalist
        ? confront.perCountry[country.id]
        : TIER_BONUS[country.tier] // os 4 não-finalistas seguem a regra normal
      : TIER_BONUS[country.tier];

    let eventPercent = 0;
    if (event.type === "all") eventPercent = event.gdpPercent;
    else if (event.type === "tag" && country.themeTags.includes(event.tag))
      eventPercent = event.gdpPercent;
    else if (event.type === "random1" && country.id === event.randomTargetCountryId)
      eventPercent = event.gdpPercent;

    let amount = country.gdpBase * (1 + structuralBonus) * (1 + eventPercent);
    if (sabotage?.targetId === country.id) {
      amount *= 1 - SABOTAGE_GDP_CUT_PERCENT;
    }
    gdpAmounts[country.id] = Math.round(amount);
  }

  // Roubo de PIB: aplicado depois, sobre o PIB já calculado (inclusive já
  // afetado pela sabotagem, se houver) — rouba uma fatia do alvo sorteado e
  // cobra um custo fixo do atacante.
  if (theft) {
    const stolen = Math.round(gdpAmounts[theft.targetId] * STEAL_GDP_PERCENT);
    gdpAmounts[theft.targetId] -= stolen;
    gdpAmounts[theft.attackerId] += stolen - STEAL_ATTACKER_PENALTY;
  }

  return gdpAmounts;
}

// --- Fases do leilão às cegas -------------------------------------------------
// remainingSec: segundos restantes no cronômetro do leilão. Mesma regra pra
// todas as rodadas (normais e final):
//   "fixedBet" -> cada país pode dar 1 único lance selado, sem comparação
//   "locked"   -> ninguém pode dar lance
//   "newBids"  -> lances de verdade, precisa superar o maior lance atual
export function getAuctionStage(remainingSec) {
  if (remainingSec > FIXED_BET_UNTIL_REMAINING_SEC) return "fixedBet";
  if (remainingSec > NEW_BIDS_FROM_REMAINING_SEC) return "locked";
  return "newBids";
}

// Os valores dos lances só ficam visíveis nos segundos finais, mesmo depois
// que "novos lances" já foi liberado.
export function isBidRevealed(remainingSec) {
  return remainingSec <= VALUES_REVEAL_FROM_REMAINING_SEC;
}

// --- Inflação cumulativa -----------------------------------------------------
// balances: { countryId: saldoAtual }
// baseRate: taxa base da rodada (pontos percentuais, ex: 5)
// event: evento da rodada (pode aumentar a taxa via inflationBonus)
// cardExemptCountryIds: países que usaram a carta "zero_inflation" nesta rodada
// winnerId/secondPlaceId: resultado do leilão da rodada — o vencedor não paga
// punição extra; quem fez o 2º maior lance (arriscou e não levou) paga
// SECOND_PLACE_INFLATION_EXTRA a mais; os demais pagam NON_WINNER_INFLATION_EXTRA.
export function computeInflation({
  balances,
  baseRate,
  event,
  cardExemptCountryIds = [],
  winnerId = null,
  secondPlaceId = null,
}) {
  const baseEffectiveRate = baseRate + (event?.inflationBonus || 0);
  const newBalances = {};
  const ratesByCountry = {};

  for (const country of COUNTRIES) {
    const current = balances[country.id] ?? 0;
    if (cardExemptCountryIds.includes(country.id)) {
      ratesByCountry[country.id] = 0;
      newBalances[country.id] = current;
      continue;
    }
    let extra = 0;
    if (country.id === winnerId) extra = 0;
    else if (country.id === secondPlaceId) extra = SECOND_PLACE_INFLATION_EXTRA;
    else extra = NON_WINNER_INFLATION_EXTRA;

    const rate = baseEffectiveRate + extra;
    ratesByCountry[country.id] = rate;
    newBalances[country.id] = Math.round(current * (1 - rate / 100));
  }

  return { baseEffectiveRate, ratesByCountry, newBalances };
}

// --- Resolução do leilão -----------------------------------------------------
// bids: [{ countryId, amount, ts }]
// barredCountryIds: países que já venceram o máximo de rodadas normais
// permitido (regra "não pode vencer mais de 2 rodadas normais") e por isso não
// podem vencer este leilão — se todos os lances forem de países barrados,
// vence mesmo assim quem deu o maior lance, pois bloquear não teria propósito
// sem alternativa.
export function resolveAuction(bids, barredCountryIds = []) {
  if (!bids || bids.length === 0) {
    return { winnerId: null, amountPaid: 0 };
  }
  const eligibleBids = bids.filter((b) => !barredCountryIds.includes(b.countryId));
  const pool = eligibleBids.length > 0 ? eligibleBids : bids;
  const highest = pool.reduce((best, b) => (b.amount > best.amount ? b : best), pool[0]);
  return { winnerId: highest.countryId, amountPaid: highest.amount };
}

// --- Apuração dos finalistas (seção 11) --------------------------------------
// Sempre resolve automaticamente para exatamente 2 finalistas, em cascata:
// 1) quem venceu mais leilões nas rodadas preliminares; 2) em empate, quem
// apostou mais no total (ganhando ou perdendo); 3) em novo empate, quem tem
// maior saldo atual; 4) se ainda empatar, sorteio aleatório. Nunca exige
// decisão manual do mestre. Funciona com qualquer nº de rodadas preliminares
// (hoje: r1, r2, r3).
// rounds: { r1: { winnerId, auction: { bids } }, r2: {...}, r3: {...} }
// balances: { countryId: saldoAtual } — usado no 3º critério de desempate
export function computeFinalists(rounds, balances = {}) {
  const winCounts = {};
  const totalBidsByCountry = {};
  for (const country of COUNTRIES) {
    winCounts[country.id] = 0;
    totalBidsByCountry[country.id] = 0;
  }

  for (const roundKey of PRELIMINARY_ROUND_KEYS) {
    const winnerId = rounds[roundKey]?.winnerId;
    if (winnerId) winCounts[winnerId] = (winCounts[winnerId] || 0) + 1;

    const bids = rounds[roundKey]?.auction?.bids || [];
    const bidList = Array.isArray(bids) ? bids : Object.values(bids);
    for (const bid of bidList) {
      totalBidsByCountry[bid.countryId] = (totalBidsByCountry[bid.countryId] || 0) + bid.amount;
    }
  }

  // Seed de desempate aleatório fixado nesta chamada, pra ordenação estável.
  const randomSeed = {};
  for (const id of shuffle(COUNTRIES.map((c) => c.id))) {
    randomSeed[id] = Object.keys(randomSeed).length;
  }

  const sorted = [...COUNTRIES.map((c) => c.id)].sort((a, b) => {
    if (winCounts[b] !== winCounts[a]) return winCounts[b] - winCounts[a];
    if (totalBidsByCountry[b] !== totalBidsByCountry[a])
      return totalBidsByCountry[b] - totalBidsByCountry[a];
    const balA = balances[a] ?? 0;
    const balB = balances[b] ?? 0;
    if (balB !== balA) return balB - balA;
    return randomSeed[a] - randomSeed[b];
  });

  return { finalists: [sorted[0], sorted[1]] };
}

// --- Campeão de riqueza real --------------------------------------------------
export function computeWealthChampion(balances) {
  let bestId = null;
  let bestBalance = -Infinity;
  for (const country of COUNTRIES) {
    const balance = balances[country.id] ?? 0;
    if (balance > bestBalance) {
      bestBalance = balance;
      bestId = country.id;
    }
  }
  return bestId;
}

// --- Ranking (ordenação por saldo) --------------------------------------------
export function computeRanking(balances) {
  return [...COUNTRIES.map((c) => c.id)].sort(
    (a, b) => (balances[b] ?? 0) - (balances[a] ?? 0)
  );
}
