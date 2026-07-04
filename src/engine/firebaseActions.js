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

function initialCountriesState() {
  const state = {};
  for (const c of COUNTRIES) {
    state[c.id] = {
      balance: c.treasuryInitial,
      cardUsed: false,
      cardUsedInRound: null,
      history: [],
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
    finalistsNeedsManualPick: false,
    finalistCandidates: [],
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
export async function drawCountries() {
  const snap = await get(sessionRef("leaders"));
  const leaders = snap.val() || {};
  const leaderIds = Object.keys(leaders);
  const assignment = drawCountryAssignment(leaderIds);
  await update(sessionRef(), {
    assignment,
    phase: "playing",
    currentRoundKey: "r1",
    roundPhase: "idle",
  });
}

// --- Ciclo da rodada ----------------------------------------------------------
export async function revealEvent(roundKey) {
  const event = drawEvent();
  await update(sessionRef(), { currentRoundKey: roundKey, roundPhase: "event" });
  await set(sessionRef("rounds", roundKey, "event"), event);
  return event;
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

export async function askCardQuestion(roundKey) {
  await update(sessionRef(), { roundPhase: "cardQuestion" });
  await set(sessionRef("rounds", roundKey, "cardQuestion"), { active: true, responses: {} });
}

export async function leaderDecideCard(roundKey, countryId, useCard) {
  await set(sessionRef("rounds", roundKey, "cardQuestion", "responses", countryId), useCard);
  if (useCard) {
    await update(sessionRef("countries", countryId), {
      cardUsed: true,
      cardUsedInRound: roundKey,
    });
  }
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
  const auctionSnap = await get(sessionRef("rounds", roundKey, "auction"));
  const auction = auctionSnap.val() || {};
  const bids = auction.bids ? Object.values(auction.bids) : [];
  const highest = bids.reduce((max, b) => Math.max(max, b.amount), 0);

  if (amount < highest + MIN_BID_INCREMENT) {
    throw new Error(
      `O lance precisa ser de pelo menos ${highest + MIN_BID_INCREMENT} moedas.`
    );
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

  const cardExemptCountryIds = COUNTRIES.filter(
    (c) =>
      countries[c.id]?.cardUsedInRound === roundKey && c.card.effectType === "zero_inflation"
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

  const updates = { roundPhase: "ranking" };
  const finalBalances = {};
  const balancesBeforeRanking = {};

  for (const c of COUNTRIES) {
    const state = countries[c.id] || {};
    balancesBeforeRanking[c.id] = state.balance ?? 0;
    let balance = state.balance ?? 0;
    let cardRevealed = null;

    if (state.cardUsedInRound === roundKey && c.card.effectType === "flat_bonus") {
      balance += c.card.effectValue;
      cardRevealed = {
        name: c.card.name,
        narrative: c.card.narrative,
        effectText: c.card.effectText,
      };
      updates[`countries/${c.id}/balance`] = balance;
    } else if (state.cardUsedInRound === roundKey && c.card.effectType === "zero_inflation") {
      cardRevealed = {
        name: c.card.name,
        narrative: c.card.narrative,
        effectText: c.card.effectText,
      };
    }

    finalBalances[c.id] = balance;

    const historyEntry = {
      roundKey,
      eventName: round.event?.name ?? null,
      gdpCredited: round.gdpAmounts?.[c.id] ?? 0,
      auctionParticipated: !!(round.auction?.bids &&
        Object.values(round.auction.bids).some((b) => b.countryId === c.id)),
      auctionWon: round.auction?.winnerId === c.id,
      amountPaid: round.auction?.winnerId === c.id ? round.auction.amountPaid : 0,
      inflationRate: round.inflationRate ?? 0,
      cardRevealed,
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

export async function computeFinalistsAction() {
  const roundsSnap = await get(sessionRef("rounds"));
  const rounds = roundsSnap.val() || {};
  const { finalists, needsManualPick, candidates } = computeFinalists(rounds);
  await update(sessionRef(), {
    finalists: finalists.length ? finalists : null,
    finalistsNeedsManualPick: needsManualPick,
    finalistCandidates: candidates,
    roundPhase: "finalistPick",
  });
}

export async function manuallyPickFinalists(countryIds) {
  await update(sessionRef(), {
    finalists: countryIds,
    finalistsNeedsManualPick: false,
    finalistCandidates: [],
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

// Usado por um watcher (setInterval) no painel do mestre para incrementar um
// contador atômico de "quem apostou mais" não é necessário: os totais são
// recalculados sob demanda em computeFinalists() a partir dos lances brutos.
export async function bidsHighest(roundKey) {
  const snap = await get(sessionRef("rounds", roundKey, "auction", "bids"));
  const bids = snap.val() ? Object.values(snap.val()) : [];
  return bids.reduce((max, b) => Math.max(max, b.amount), 0);
}
