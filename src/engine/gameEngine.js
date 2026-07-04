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
// roundKey: 'r1' | 'r2' | 'final'
// event: objeto retornado por drawEvent()
// finalists: [id, id] (apenas relevante quando roundKey === 'final')
// confront: resultado de computeConfrontVariable (apenas na final)
// sabotage: { attackerId, targetId } se alguém usou a carta de Sabotagem de PIB nesta rodada
export function computeGdpForRound({ roundKey, event, finalists, confront, sabotage }) {
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

  return gdpAmounts;
}

// --- Inflação cumulativa -----------------------------------------------------
// balances: { countryId: saldoAtual }
// baseRate: taxa base da rodada (pontos percentuais, ex: 5)
// event: evento da rodada (pode aumentar a taxa via inflationBonus)
// cardExemptCountryIds: países que usaram a carta "zero_inflation" nesta rodada
export function computeInflation({ balances, baseRate, event, cardExemptCountryIds = [] }) {
  const effectiveRate = baseRate + (event?.inflationBonus || 0);
  const newBalances = {};
  for (const country of COUNTRIES) {
    const current = balances[country.id] ?? 0;
    if (cardExemptCountryIds.includes(country.id)) {
      newBalances[country.id] = current;
    } else {
      newBalances[country.id] = Math.round(current * (1 - effectiveRate / 100));
    }
  }
  return { effectiveRate, newBalances };
}

// --- Resolução do leilão -----------------------------------------------------
// bids: [{ countryId, amount, ts }]
export function resolveAuction(bids) {
  if (!bids || bids.length === 0) {
    return { winnerId: null, amountPaid: 0 };
  }
  const highest = bids.reduce((best, b) => (b.amount > best.amount ? b : best), bids[0]);
  return { winnerId: highest.countryId, amountPaid: highest.amount };
}

// --- Apuração dos finalistas (seção 11) --------------------------------------
// Sempre resolve automaticamente para exatamente 2 finalistas, em cascata:
// 1) quem venceu mais leilões pré-final; 2) em empate, quem apostou mais no
// total (ganhando ou perdendo); 3) em novo empate, quem tem maior saldo atual;
// 4) se ainda empatar, sorteio aleatório. Nunca exige decisão manual do mestre.
// rounds: { r1: { winnerId, auction: { bids } }, r2: { winnerId, auction: { bids } } }
// balances: { countryId: saldoAtual } — usado no 3º critério de desempate
export function computeFinalists(rounds, balances = {}) {
  const w1 = rounds.r1?.winnerId ?? null;
  const w2 = rounds.r2?.winnerId ?? null;

  const totalBidsByCountry = {};
  for (const country of COUNTRIES) totalBidsByCountry[country.id] = 0;
  for (const roundKey of ["r1", "r2"]) {
    const bids = rounds[roundKey]?.auction?.bids || [];
    const bidList = Array.isArray(bids) ? bids : Object.values(bids);
    for (const bid of bidList) {
      totalBidsByCountry[bid.countryId] = (totalBidsByCountry[bid.countryId] || 0) + bid.amount;
    }
  }

  function pickBest(candidateIds) {
    let pool = topTiedBy(candidateIds, (id) => totalBidsByCountry[id] || 0);
    if (pool.length > 1) pool = topTiedBy(pool, (id) => balances[id] ?? 0);
    if (pool.length > 1) pool = shuffle(pool);
    return pool[0];
  }

  if (w1 && w2 && w1 !== w2) {
    return { finalists: [w1, w2] };
  }

  if (w1 && w2 && w1 === w2) {
    const candidates = COUNTRIES.map((c) => c.id).filter((id) => id !== w1);
    return { finalists: [w1, pickBest(candidates)] };
  }

  const singleWinner = w1 || w2;
  if (singleWinner) {
    const candidates = COUNTRIES.map((c) => c.id).filter((id) => id !== singleWinner);
    return { finalists: [singleWinner, pickBest(candidates)] };
  }

  // Ninguém venceu nenhuma rodada (ninguém deu lance em nenhum leilão pré-final).
  const allIds = COUNTRIES.map((c) => c.id);
  const first = pickBest(allIds);
  const second = pickBest(allIds.filter((id) => id !== first));
  return { finalists: [first, second] };
}

function topTiedBy(ids, keyFn) {
  const best = Math.max(...ids.map(keyFn));
  return ids.filter((id) => keyFn(id) === best);
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
