// ============================================================================
// AÇÕES QUE ESCREVEM NO FIREBASE — única porta de entrada para mudar o estado
// vivo do jogo (/session). Os cálculos pesados vêm de ./gameEngine.js (puro);
// aqui só orquestramos leitura -> cálculo -> escrita.
// ============================================================================
import { ref, get, set, update, push } from "firebase/database";
import { db } from "../firebase";
import {
  COUNTRIES,
  PRIZES,
  INFLATION_RATES,
  MIN_BID_INCREMENT,
  AUCTION_DURATION_SEC,
  SABOTAGE_COST_PERCENT,
  BID_COOLDOWN_MS,
  PRELIMINARY_ROUND_KEYS,
  MAX_PRELIMINARY_WINS,
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
  isBidRevealed,
  getAuctionStage,
} from "./gameEngine";

const SESSION_PATH = "session";
// Mapa de "próxima rodada preliminar" usado pelo botão de avançar do mestre.
const NEXT_PRELIMINARY_ROUND = { r1: "r2", r2: "r3" };

// Países que já venceram o máximo de rodadas normais permitido (ver
// MAX_PRELIMINARY_WINS) não podem vencer mais nenhuma — ficam automaticamente
// classificados pra final assim que batem esse número.
function countriesAtWinCap(rounds) {
  const wins = {};
  for (const roundKey of PRELIMINARY_ROUND_KEYS) {
    const winnerId = rounds[roundKey]?.winnerId;
    if (winnerId) wins[winnerId] = (wins[winnerId] || 0) + 1;
  }
  return Object.keys(wins).filter((id) => wins[id] >= MAX_PRELIMINARY_WINS);
}

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
    prizes: { ...PRIZES },
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

// --- Prêmios (configuráveis pelo mestre) --------------------------------------
export async function setPrizes(prizes) {
  await set(sessionRef("prizes"), prizes);
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
// Ordem: evento -> pergunta sobre cartas -> crédito de PIB -> "bastidores" do
// leilão (recapitulação, sem cronômetro ainda) -> leilão (cronômetro ligado)
// -> resultado -> inflação -> ranking. As cartas vêm antes do PIB para que
// Sabotagem/Roubo (se usadas) já afetem o PIB creditado nesta mesma rodada.
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

// Carta de Sabotagem de PIB (Chile): alvo é SORTEADO aleatoriamente. Tem custo
// imediato (% do saldo atual) e reduz o PIB que o alvo vai receber nesta
// rodada (aplicado em creditGdp).
export async function useSabotageCard(roundKey, attackerCountryId, cardId) {
  const balSnap = await get(sessionRef("countries", attackerCountryId, "balance"));
  const balance = balSnap.val() ?? 0;
  const cost = Math.round(balance * SABOTAGE_COST_PERCENT);

  const others = COUNTRIES.map((c) => c.id).filter((id) => id !== attackerCountryId);
  const targetId = others[Math.floor(Math.random() * others.length)];

  await update(sessionRef(), {
    [`countries/${attackerCountryId}/balance`]: balance - cost,
    [`countries/${attackerCountryId}/cardsUsed/${cardId}`]: true,
    [`countries/${attackerCountryId}/cardsUsedInRound/${cardId}`]: roundKey,
    [`rounds/${roundKey}/sabotage`]: { attackerId: attackerCountryId, targetId, cost },
    [`rounds/${roundKey}/cardQuestion/responses/${attackerCountryId}/${cardId}`]: true,
  });
}

// Carta de Roubo de PIB (Portugal): alvo é ESCOLHIDO pelo líder. Custa um
// valor fixo de PIB do próprio atacante nesta rodada (aplicado em creditGdp).
export async function useTheftCard(roundKey, attackerCountryId, targetCountryId, cardId) {
  await update(sessionRef(), {
    [`countries/${attackerCountryId}/cardsUsed/${cardId}`]: true,
    [`countries/${attackerCountryId}/cardsUsedInRound/${cardId}`]: roundKey,
    [`rounds/${roundKey}/theft`]: { attackerId: attackerCountryId, targetId: targetCountryId },
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
    theft: round.theft || null,
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

// Prepara a tela de "bastidores" do leilão (recapitulação de ataques e ações
// da rodada) — o cronômetro AINDA não começa aqui.
export async function prepareAuction(roundKey) {
  await set(sessionRef("rounds", roundKey, "auction"), {
    active: false,
    endsAt: null,
    bids: {},
    winnerId: null,
    amountPaid: 0,
    prizeRevealed: false,
    finalized: false,
  });
  await update(sessionRef(), { roundPhase: "auctionIntro" });
}

// Liga o cronômetro de verdade (chamado depois da tela de bastidores).
export async function startAuctionTimer(roundKey, serverTimeOffset = 0) {
  const now = Date.now() + serverTimeOffset;
  await update(sessionRef(), { roundPhase: "auction" });
  await update(sessionRef("rounds", roundKey, "auction"), {
    active: true,
    endsAt: now + AUCTION_DURATION_SEC * 1000,
  });
}

export async function revealPrize(roundKey) {
  await set(sessionRef("rounds", roundKey, "auction", "prizeRevealed"), true);
}

export async function placeBid(roundKey, countryId, amount, serverTimeOffset = 0) {
  if (PRELIMINARY_ROUND_KEYS.includes(roundKey)) {
    const roundsSnap = await get(sessionRef("rounds"));
    const capped = countriesAtWinCap(roundsSnap.val() || {});
    if (capped.includes(countryId)) {
      throw new Error("Seu país já está classificado para a final e não participa mais dos leilões preliminares.");
    }
  }

  const [auctionSnap, balanceSnap] = await Promise.all([
    get(sessionRef("rounds", roundKey, "auction")),
    get(sessionRef("countries", countryId, "balance")),
  ]);
  const auction = auctionSnap.val() || {};
  const balance = balanceSnap.val() ?? 0;
  const bids = auction.bids ? Object.values(auction.bids) : [];
  const now = Date.now() + serverTimeOffset;

  const ownBids = bids.filter((b) => b.countryId === countryId);
  const lastOwnBidTs = ownBids.reduce((max, b) => Math.max(max, b.ts), 0);
  if (lastOwnBidTs && now - lastOwnBidTs < BID_COOLDOWN_MS) {
    throw new Error("Espere 1 segundo entre um lance e outro.");
  }

  const remainingSec = auction.endsAt ? Math.ceil((auction.endsAt - now) / 1000) : 0;
  const stage = getAuctionStage(remainingSec);
  const revealed = isBidRevealed(remainingSec);

  if (stage === "locked") {
    throw new Error("Os lances estão travados neste momento. Aguarde a próxima fase do leilão.");
  }

  if (stage === "fixedBet") {
    // Fase de aposta fixa: 1 lance selado por país, sem comparação com os outros.
    if (ownBids.length > 0) {
      throw new Error("Você já fez sua aposta fixa nesta rodada. Aguarde a fase de novos lances.");
    }
    if (amount < MIN_BID_INCREMENT) {
      throw new Error(`Sua aposta precisa ser de pelo menos ${MIN_BID_INCREMENT} moedas.`);
    }
  } else {
    // Fase de novos lances: precisa superar o maior lance atual (que pode ser
    // uma aposta fixa da fase anterior).
    const highest = bids.reduce((max, b) => Math.max(max, b.amount), 0);
    const minNext = highest + MIN_BID_INCREMENT;
    if (amount < minNext) {
      throw new Error(
        revealed
          ? `O lance precisa ser de pelo menos ${minNext} moedas.`
          : "Lance recusado: não supera o lance mais alto atual (ainda oculto)."
      );
    }
  }

  if (amount > balance) {
    throw new Error(`Você não pode apostar mais do que seu saldo atual (${balance} moedas).`);
  }

  const bidsRef = sessionRef("rounds", roundKey, "auction", "bids");
  const newBidRef = push(bidsRef);
  await set(newBidRef, { countryId, amount, ts: now });
}

export async function finalizeAuction(roundKey) {
  const [auctionSnap, countriesSnap] = await Promise.all([
    get(sessionRef("rounds", roundKey, "auction")),
    get(sessionRef("countries")),
  ]);
  const auction = auctionSnap.val() || {};
  // Evita finalizar duas vezes (ex: watcher do cronômetro disparando 2x).
  if (auction.finalized) return;

  let barredCountryIds = [];
  if (PRELIMINARY_ROUND_KEYS.includes(roundKey)) {
    const roundsSnap = await get(sessionRef("rounds"));
    barredCountryIds = countriesAtWinCap(roundsSnap.val() || {});
  }

  const bids = auction.bids ? Object.values(auction.bids) : [];
  const { winnerId, amountPaid } = resolveAuction(bids, barredCountryIds);

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

  // Quem ficou em 2º no leilão (maior lance entre os que não venceram) paga
  // mais inflação por ter arriscado e não levado; os demais pagam um pouco
  // mais; o vencedor não tem punição extra.
  const winnerId = round.auction?.winnerId ?? null;
  const allBids = round.auction?.bids ? Object.values(round.auction.bids) : [];
  const nonWinnerBids = allBids.filter((b) => b.countryId !== winnerId);
  const secondPlaceId = nonWinnerBids.length
    ? nonWinnerBids.reduce((best, b) => (b.amount > best.amount ? b : best), nonWinnerBids[0]).countryId
    : null;

  const { baseEffectiveRate, ratesByCountry, newBalances } = computeInflation({
    balances,
    baseRate: INFLATION_RATES[roundKey],
    event: round.event,
    cardExemptCountryIds,
    winnerId,
    secondPlaceId,
  });

  const updates = { roundPhase: "inflation" };
  for (const c of COUNTRIES) {
    updates[`countries/${c.id}/balance`] = newBalances[c.id];
  }
  updates[`rounds/${roundKey}/inflationApplied`] = true;
  updates[`rounds/${roundKey}/inflationRate`] = baseEffectiveRate;
  updates[`rounds/${roundKey}/inflationRatesByCountry`] = ratesByCountry;
  updates[`rounds/${roundKey}/inflationSecondPlaceId`] = secondPlaceId;
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
  const theft = round.theft || null;

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
    if (theft?.targetId === c.id) {
      const attackerName = countryConfig(theft.attackerId)?.name ?? "um país rival";
      cardsRevealed.push({
        name: "Roubo de PIB sofrido",
        narrative: `${attackerName} roubou parte do seu PIB nesta rodada.`,
        effectText: "10% do seu PIB desta rodada foi desviado.",
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
      inflationRate: round.inflationRatesByCountry?.[c.id] ?? round.inflationRate ?? 0,
      cardsRevealed,
      balanceAfter: balance,
    };
    updates[`countries/${c.id}/history/${roundKey}`] = historyEntry;
  }

  updates.ranking = computeRanking(finalBalances);
  updates[`rounds/${roundKey}/balancesBeforeRanking`] = balancesBeforeRanking;

  await update(sessionRef(), updates);
}

// Avança para a próxima rodada preliminar (r1 -> r2 -> r3).
export async function advanceRound(nextRoundKey) {
  await update(sessionRef(), { currentRoundKey: nextRoundKey, roundPhase: "idle" });
}

export function nextPreliminaryRound(roundKey) {
  return NEXT_PRELIMINARY_ROUND[roundKey] ?? null;
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
