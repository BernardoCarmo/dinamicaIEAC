// ============================================================================
// AÇÕES QUE ESCREVEM NO FIREBASE — única porta de entrada para mudar o estado
// vivo do jogo (/session). Os cálculos pesados vêm de ./gameEngine.js (puro);
// aqui só orquestramos leitura -> cálculo -> escrita.
// ============================================================================
import { ref, get, set, update, push } from "firebase/database";
import { db } from "../firebase";
import {
  COUNTRIES,
  INFLATION_RATES,
  MIN_BID_INCREMENT,
  AUCTION_DURATION_SEC,
  SABOTAGE_COST_PERCENT,
} from "../config/gameConfig";
import {
  drawCountryAssignment,
  drawEvent,
  computeConfrontVariable,
  computeGdpForRound,
  computeInflation,
  resolveAuction,
  computeFinalists,
  computeWealthChampion,
  computeRanking,
} from "./gameEngine";

const SESSION_PATH = "session";

function sessionRef(...segments) {
  return ref(db, [SESSION_PATH, ...segments].join("/"));
}

function countryConfig(countryId) {
  return COUNTRIES.find((c) => c.id === countryId);
}

function findCard(countryId, cardId) {
  return countryConfig(countryId)?.cards.find((card) => card.id === cardId) ?? null;
}

function initialCountriesState() {
  const state = {};
  for (const c of COUNTRIES) {
    state[c.id] = {
      balance: c.treasuryInitial,
      cardsUsed: {},
      cardsUsedInRound: {},
      history: {},
    };
  }
  return state;
}

function defaultSession() {
  return {
    phase: "login",
    leaders: {},
    assignment: {},
    currentRoundKey: null,
    roundPhase: "idle",
    countries: initialCountriesState(),
    rounds: {},
    finalists: null,
    champion: null,
    wealthChampion: null,
    ranking: null,
  };
}

export async function ensureSessionInitialized() {
  const snap = await get(sessionRef());
  if (!snap.exists()) {
    await set(sessionRef(), defaultSession());
  }
}

export async function resetGame() {
  await set(sessionRef(), defaultSession());
}

// --- Login / sala de espera --------------------------------------------------
export async function joinAsLeader(name) {
  const leadersRef = sessionRef("leaders");
  const newRef = push(leadersRef);
  await set(newRef, { name, joinedAt: Date.now() });
  return newRef.key;
}

export async function leaderStillExists(leaderId) {
  const snap = await get(sessionRef("leaders", leaderId));
  return snap.exists();
}

// --- Sorteio inicial de países -------------------------------------------
// Depois do sorteio, o telão passa por uma fase cosmética de "sorteio das
// cartas" (todo mundo já tem carta fixa por faixa, mas isso cria suspense
// antes da rodada 1 começar de verdade).
export async function drawCountries() {
  const snap = await get(sessionRef("leaders"));
  const leaders = snap.val() || {};
  const leaderIds = Object.keys(leaders);
  const assignment = drawCountryAssignment(leaderIds);
  await update(sessionRef(), {
    assignment,
    phase: "playing",
    currentRoundKey: "r1",
    roundPhase: "cardDeal",
  });
}

export async function finishCardDeal() {
  await update(sessionRef(), { roundPhase: "idle" });
}

// --- Ciclo da rodada ----------------------------------------------------------
// Ordem: evento -> pergunta sobre cartas -> crédito de PIB -> leilão -> resultado
// -> inflação -> ranking. As cartas vêm antes do PIB para que a Sabotagem de
// PIB (se usada) já afete o PIB creditado nesta mesma rodada.
export async function revealEvent(roundKey) {
  const event = drawEvent();
  await update(sessionRef(), { currentRoundKey: roundKey, roundPhase: "event" });
  await set(sessionRef("rounds", roundKey, "event"), event);
  return event;
}

export async function askCardQuestion(roundKey) {
  await update(sessionRef(), { roundPhase: "cardQuestion" });
  await set(sessionRef("rounds", roundKey, "cardQuestion"), { active: true, responses: {} });
}

export async function leaderDecideCard(roundKey, countryId, cardId, useCard) {
  await set(
    sessionRef("rounds", roundKey, "cardQuestion", "responses", countryId, cardId),
    useCard
  );
  if (!useCard) return;

  const card = findCard(countryId, cardId);
  const updates = {
    [`countries/${countryId}/cardsUsed/${cardId}`]: true,
    [`countries/${countryId}/cardsUsedInRound/${cardId}`]: roundKey,
  };

  if (card.effectType === "flat_bonus") {
    const balSnap = await get(sessionRef("countries", countryId, "balance"));
    const current = balSnap.val() ?? 0;
    updates[`countries/${countryId}/balance`] = current + card.effectValue;
  }

  await update(sessionRef(), updates);
}

// Carta de Sabotagem de PIB: exige escolher um alvo, tem custo imediato e
// reduz o PIB que o alvo vai receber nesta rodada (aplicado em creditGdp).
export async function useSabotageCard(roundKey, attackerCountryId, targetCountryId, cardId) {
  const balSnap = await get(sessionRef("countries", attackerCountryId, "balance"));
  const balance = balSnap.val() ?? 0;
  const cost = Math.round(balance * SABOTAGE_COST_PERCENT);

  await update(sessionRef(), {
    [`countries/${attackerCountryId}/balance`]: balance - cost,
    [`countries/${attackerCountryId}/cardsUsed/${cardId}`]: true,
    [`countries/${attackerCountryId}/cardsUsedInRound/${cardId}`]: roundKey,
    [`rounds/${roundKey}/sabotage`]: { attackerId: attackerCountryId, targetId: targetCountryId, cost },
    [`rounds/${roundKey}/cardQuestion/responses/${attackerCountryId}/${cardId}`]: true,
  });
}

export async function creditGdp(roundKey) {
  const [countriesSnap, roundSnap, finalistsSnap] = await Promise.all([
    get(sessionRef("countries")),
    get(sessionRef("rounds", roundKey)),
    get(sessionRef("finalists")),
  ]);
  const countries = countriesSnap.val() || {};
  const round = roundSnap.val() || {};
  const finalists = finalistsSnap.val() || null;

  const gdpAmounts = computeGdpForRound({
    roundKey,
    event: round.event,
    finalists,
    confront: round.confront,
    sabotage: round.sabotage || null,
  });

  const balancesBefore = {};
  const updates = {};
  for (const c of COUNTRIES) {
    const before = countries[c.id]?.balance ?? 0;
    balancesBefore[c.id] = before;
    updates[`countries/${c.id}/balance`] = before + gdpAmounts[c.id];
  }
  updates[`rounds/${roundKey}/gdpAmounts`] = gdpAmounts;
  updates[`rounds/${roundKey}/balancesBeforeGdp`] = balancesBefore;
  updates.roundPhase = "gdp";

  await update(sessionRef(), updates);
}

export async function startAuction(roundKey, serverTimeOffset = 0) {
  const isFinal = roundKey === "final";
  const now = Date.now() + serverTimeOffset;
  await set(sessionRef("rounds", roundKey, "auction"), {
    active: true,
    endsAt: isFinal ? null : now + AUCTION_DURATION_SEC * 1000,
    lastBidAt: isFinal ? now : null,
    bids: {},
    winnerId: null,
    amountPaid: 0,
    prizeRevealed: false,
    finalized: false,
  });
  await update(sessionRef(), { roundPhase: "auction" });
}

export async function revealPrize(roundKey) {
  await set(sessionRef("rounds", roundKey, "auction", "prizeRevealed"), true);
}

export async function placeBid(roundKey, countryId, amount, serverTimeOffset = 0) {
  const [auctionSnap, balanceSnap] = await Promise.all([
    get(sessionRef("rounds", roundKey, "auction")),
    get(sessionRef("countries", countryId, "balance")),
  ]);
  const auction = auctionSnap.val() || {};
  const balance = balanceSnap.val() ?? 0;
  const bids = auction.bids ? Object.values(auction.bids) : [];
  const highest = bids.reduce((max, b) => Math.max(max, b.amount), 0);
  const minNext = highest + MIN_BID_INCREMENT;

  if (amount < minNext) {
    throw new Error(`O lance precisa ser de pelo menos ${minNext} moedas.`);
  }
  if (amount > balance) {
    throw new Error(`Você não pode apostar mais do que seu saldo atual (${balance} moedas).`);
  }

  const now = Date.now() + serverTimeOffset;
  const bidsRef = sessionRef("rounds", roundKey, "auction", "bids");
  const newBidRef = push(bidsRef);
  await set(newBidRef, { countryId, amount, ts: now });

  if (roundKey === "final") {
    await set(sessionRef("rounds", roundKey, "auction", "lastBidAt"), now);
  }
}

export async function finalizeAuction(roundKey) {
  const [auctionSnap, countriesSnap] = await Promise.all([
    get(sessionRef("rounds", roundKey, "auction")),
    get(sessionRef("countries")),
  ]);
  const auction = auctionSnap.val() || {};
  // Evita finalizar duas vezes (ex: watcher do cronômetro disparando 2x).
  if (auction.finalized) return;

  const bids = auction.bids ? Object.values(auction.bids) : [];
  const { winnerId, amountPaid } = resolveAuction(bids);

  const updates = {
    [`rounds/${roundKey}/auction/active`]: false,
    [`rounds/${roundKey}/auction/finalized`]: true,
    [`rounds/${roundKey}/auction/winnerId`]: winnerId,
    [`rounds/${roundKey}/auction/amountPaid`]: amountPaid,
    [`rounds/${roundKey}/winnerId`]: winnerId,
    roundPhase: "result",
  };

  if (winnerId) {
    const countries = countriesSnap.val() || {};
    const currentBalance = countries[winnerId]?.balance ?? 0;
    updates[`countries/${winnerId}/balance`] = currentBalance - amountPaid;
  }

  await update(sessionRef(), updates);
}

export async function applyInflation(roundKey) {
  const [countriesSnap, roundSnap] = await Promise.all([
    get(sessionRef("countries")),
    get(sessionRef("rounds", roundKey)),
  ]);
  const countries = countriesSnap.val() || {};
  const round = roundSnap.val() || {};

  const balances = {};
  for (const c of COUNTRIES) balances[c.id] = countries[c.id]?.balance ?? 0;

  const cardExemptCountryIds = COUNTRIES.filter((c) =>
    c.cards.some(
      (card) =>
        countries[c.id]?.cardsUsedInRound?.[card.id] === roundKey &&
        card.effectType === "zero_inflation"
    )
  ).map((c) => c.id);

  const { effectiveRate, newBalances } = computeInflation({
    balances,
    baseRate: INFLATION_RATES[roundKey],
    event: round.event,
    cardExemptCountryIds,
  });

  const updates = { roundPhase: "inflation" };
  for (const c of COUNTRIES) {
    updates[`countries/${c.id}/balance`] = newBalances[c.id];
  }
  updates[`rounds/${roundKey}/inflationApplied`] = true;
  updates[`rounds/${roundKey}/inflationRate`] = effectiveRate;
  updates[`rounds/${roundKey}/balancesBeforeInflation`] = balances;

  await update(sessionRef(), updates);
}

export async function revealRanking(roundKey) {
  const [countriesSnap, roundSnap] = await Promise.all([
    get(sessionRef("countries")),
    get(sessionRef("rounds", roundKey)),
  ]);
  const countries = countriesSnap.val() || {};
  const round = roundSnap.val() || {};
  const sabotage = round.sabotage || null;

  const updates = { roundPhase: "ranking" };
  const finalBalances = {};
  const balancesBeforeRanking = {};

  for (const c of COUNTRIES) {
    const state = countries[c.id] || {};
    balancesBeforeRanking[c.id] = state.balance ?? 0;
    const balance = state.balance ?? 0;
    finalBalances[c.id] = balance;

    const cardsRevealed = [];
    for (const card of c.cards) {
      if (state.cardsUsedInRound?.[card.id] === roundKey) {
        cardsRevealed.push({ name: card.name, narrative: card.narrative, effectText: card.effectText });
      }
    }
    if (sabotage?.targetId === c.id) {
      const attackerName = countryConfig(sabotage.attackerId)?.name ?? "um país rival";
      cardsRevealed.push({
        name: "Sabotagem de PIB sofrida",
        narrative: `${attackerName} sabotou seu país nesta rodada.`,
        effectText: "Seu PIB desta rodada foi cortado em 30%.",
      });
    }

    const historyEntry = {
      roundKey,
      eventName: round.event?.name ?? null,
      gdpCredited: round.gdpAmounts?.[c.id] ?? 0,
      auctionParticipated: !!(
        round.auction?.bids && Object.values(round.auction.bids).some((b) => b.countryId === c.id)
      ),
      auctionWon: round.auction?.winnerId === c.id,
      amountPaid: round.auction?.winnerId === c.id ? round.auction.amountPaid : 0,
      inflationRate: round.inflationRate ?? 0,
      cardsRevealed,
      balanceAfter: balance,
    };
    updates[`countries/${c.id}/history/${roundKey}`] = historyEntry;
  }

  updates.ranking = computeRanking(finalBalances);
  updates[`rounds/${roundKey}/balancesBeforeRanking`] = balancesBeforeRanking;

  await update(sessionRef(), updates);
}

export async function advanceToRound2() {
  await update(sessionRef(), { currentRoundKey: "r2", roundPhase: "idle" });
}

// Sempre resolve os 2 finalistas automaticamente (ver critério de desempate em
// cascata em gameEngine.computeFinalists) — o mestre nunca precisa escolher.
export async function computeFinalistsAction() {
  const [roundsSnap, countriesSnap] = await Promise.all([
    get(sessionRef("rounds")),
    get(sessionRef("countries")),
  ]);
  const rounds = roundsSnap.val() || {};
  const countries = countriesSnap.val() || {};
  const balances = {};
  for (const c of COUNTRIES) balances[c.id] = countries[c.id]?.balance ?? 0;

  const { finalists } = computeFinalists(rounds, balances);
  await update(sessionRef(), {
    finalists,
    roundPhase: "finalistPick",
  });
}

export async function startFinal() {
  const finalistsSnap = await get(sessionRef("finalists"));
  const finalists = finalistsSnap.val();
  const confront = computeConfrontVariable(finalists);
  await set(sessionRef("rounds", "final"), { finalists, confront });
  await update(sessionRef(), { currentRoundKey: "final", roundPhase: "vs" });
}

export async function endGame() {
  const [countriesSnap, roundsSnap] = await Promise.all([
    get(sessionRef("countries")),
    get(sessionRef("rounds")),
  ]);
  const countries = countriesSnap.val() || {};
  const rounds = roundsSnap.val() || {};
  const balances = {};
  for (const c of COUNTRIES) balances[c.id] = countries[c.id]?.balance ?? 0;

  await update(sessionRef(), {
    phase: "ended",
    roundPhase: "done",
    champion: rounds.final?.winnerId ?? null,
    wealthChampion: computeWealthChampion(balances),
    finalRanking: computeRanking(balances),
  });
}
