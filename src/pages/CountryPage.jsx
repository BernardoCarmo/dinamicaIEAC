import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseValue } from "../hooks/useFirebaseValue";
import { useServerTimeOffset } from "../hooks/useServerTimeOffset";
import { useRemainingMs } from "../hooks/useRemainingMs";
import {
  COUNTRIES,
  MIN_BID_INCREMENT,
  ROUND_KEYS,
  ROUND_LABELS,
  BID_COOLDOWN_MS,
  PRELIMINARY_ROUND_KEYS,
  MAX_PRELIMINARY_WINS,
} from "../config/gameConfig";
import { leaderDecideCard, useSabotageCard, useTheftCard, placeBid } from "../engine/firebaseActions";
import { isBidRevealed, getAuctionStage } from "../engine/gameEngine";
import CountUpNumber from "../components/shared/CountUpNumber.jsx";
import FlagBadge from "../components/shared/FlagBadge.jsx";
import Countdown from "../components/shared/Countdown.jsx";
import BidList from "../components/shared/BidList.jsx";

export default function CountryPage() {
  const navigate = useNavigate();
  const leaderId = localStorage.getItem("leaderId");
  const [session] = useFirebaseValue("session");
  const offset = useServerTimeOffset();
  const [bidAmount, setBidAmount] = useState(0);
  const [bidError, setBidError] = useState("");
  const [theftTarget, setTheftTarget] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [, forceTick] = useState(0);

  const countryId = useMemo(() => {
    const assignment = session?.assignment || {};
    return Object.entries(assignment).find(([, lid]) => lid === leaderId)?.[0] || null;
  }, [session, leaderId]);

  useEffect(() => {
    if (!leaderId) {
      navigate("/", { replace: true });
      return;
    }
    if (session && !countryId) {
      navigate("/espera", { replace: true });
    }
  }, [leaderId, session, countryId, navigate]);

  const currentRoundKey = session?.currentRoundKey;
  const roundPhase = session?.roundPhase;
  const round = currentRoundKey ? session?.rounds?.[currentRoundKey] : null;
  const countryConfig = COUNTRIES.find((c) => c.id === countryId);
  const countryState = session?.countries?.[countryId];

  const auction = round?.auction;
  const remainingMs = useRemainingMs(auction?.endsAt, offset);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const isFinalRound = currentRoundKey === "final";
  const revealed = isBidRevealed(remainingSec);
  const stage = getAuctionStage(remainingSec);

  const bids = auction?.bids || {};
  const ownBidsCount = Object.values(bids).filter((b) => b.countryId === countryId).length;
  const highestBid = Object.values(bids).reduce((max, b) => Math.max(max, b.amount), 0);
  const minNextBid = highestBid + MIN_BID_INCREMENT;

  // Só pré-preenche o campo com o mínimo calculado quando os valores estão
  // revelados — senão isso vazaria o lance mais alto mesmo com os números
  // escondidos na lista.
  useEffect(() => {
    if (stage === "newBids" && revealed) {
      setBidAmount(minNextBid);
    } else {
      setBidAmount("");
    }
  }, [minNextBid, currentRoundKey, stage, revealed]);

  // Só pra re-renderizar durante o cooldown de 1s do lance.
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => forceTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  if (!session || !countryConfig || !countryState) {
    return (
      <div className="page">
        <p>Carregando seu país...</p>
      </div>
    );
  }

  const finalists = session.finalists || [];
  const isFinalist = finalists.includes(countryId);
  const prizes = session.prizes || {};
  const winsSoFar = PRELIMINARY_ROUND_KEYS.filter((k) => session.rounds?.[k]?.winnerId === countryId).length;
  const alreadyQualifiedByWins = winsSoFar >= MAX_PRELIMINARY_WINS;

  let statusLabel = "Ativo na disputa";
  if (session.phase === "ended") {
    if (session.champion === countryId) statusLabel = "Campeão da Final!";
    else if (session.wealthChampion === countryId) statusLabel = "Campeão de Riqueza Real!";
    else statusLabel = "Jogo encerrado";
  } else if (isFinalRound) {
    statusLabel = isFinalist ? "Na disputa da Final" : "Fora dos leilões, seguindo pela riqueza real";
  } else if (session.finalists && !isFinalist) {
    statusLabel = "Fora dos leilões, seguindo pela riqueza real";
  } else if ((session.finalists && isFinalist) || alreadyQualifiedByWins) {
    statusLabel = "Classificado para a final";
  }

  const cardQuestionOpen = roundPhase === "cardQuestion" && round?.cardQuestion?.active;
  const balance = countryState.balance ?? 0;

  const inAuctionPhase = roundPhase === "auction" && auction?.active;
  const eligibleForThisAuction = isFinalRound ? isFinalist : !alreadyQualifiedByWins;
  const canAffordMinBid = balance >= minNextBid;
  const onCooldown = Date.now() < cooldownUntil;

  async function handleUseCard(card) {
    if (card.effectType === "steal_gdp") {
      setTheftTarget(card.id);
      return;
    }
    if (!window.confirm(`Usar agora a carta "${card.name}"? Isso só pode ser feito uma vez em todo o jogo.`)) {
      return;
    }
    if (card.effectType === "sabotage_gdp") {
      if (!window.confirm("O alvo será sorteado aleatoriamente. Confirmar Sabotagem de PIB?")) return;
      await useSabotageCard(currentRoundKey, countryId, card.id);
      return;
    }
    await leaderDecideCard(currentRoundKey, countryId, card.id, true);
  }

  async function handleConfirmTheft(cardId, targetId) {
    if (
      !window.confirm(
        `Confirmar Roubo de PIB contra ${COUNTRIES.find((c) => c.id === targetId)?.name}? Vai custar 150 de PIB próprio.`
      )
    ) {
      return;
    }
    await useTheftCard(currentRoundKey, countryId, targetId, cardId);
    setTheftTarget(null);
  }

  async function handleDeclineCard(cardId) {
    await leaderDecideCard(currentRoundKey, countryId, cardId, false);
  }

  async function handleBid(e) {
    e.preventDefault();
    setBidError("");
    try {
      await placeBid(currentRoundKey, countryId, Number(bidAmount), offset);
      setCooldownUntil(Date.now() + BID_COOLDOWN_MS);
    } catch (err) {
      setBidError(err.message);
    }
  }

  const history = ROUND_KEYS.map((k) => countryState.history?.[k]).filter(Boolean);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="card">
          <FlagBadge country={countryConfig} size="lg" />
          <div style={{ marginTop: 14 }}>
            <div className="section-title">Saldo atual</div>
            <div style={{ fontSize: "3rem" }}>
              <CountUpNumber value={balance} className="money positive" />
            </div>
          </div>
          <div className="badge" style={{ background: "var(--bg-panel)", color: "var(--text)", marginTop: 6 }}>
            {statusLabel}
          </div>
        </div>

        {countryConfig.cards.map((card) => {
          const used = countryState.cardsUsed?.[card.id];
          if (used) return null;
          const alreadyResponded = round?.cardQuestion?.responses?.[countryId]?.[card.id] !== undefined;
          const canDecideNow = cardQuestionOpen && !alreadyResponded;

          return (
            <div
              key={card.id}
              className="card"
              style={{ marginTop: 16, borderColor: cardQuestionOpen ? "var(--accent)" : undefined }}
            >
              <div className="section-title">Sua carta especial</div>
              <h3>{card.name}</h3>
              <p>{card.narrative}</p>
              <p>
                <strong>Efeito:</strong> {card.effectText}
              </p>

              {theftTarget === card.id ? (
                <div>
                  <p>Escolha o país-alvo:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {COUNTRIES.filter((c) => c.id !== countryId).map((c) => (
                      <button key={c.id} className="btn" onClick={() => handleConfirmTheft(card.id, c.id)}>
                        {c.flag} {c.name}
                      </button>
                    ))}
                  </div>
                  <button className="btn" onClick={() => setTheftTarget(null)}>
                    Cancelar
                  </button>
                </div>
              ) : canDecideNow ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => handleUseCard(card)}>
                    Usar carta agora
                  </button>
                  <button className="btn" onClick={() => handleDeclineCard(card.id)}>
                    Não usar agora
                  </button>
                </div>
              ) : (
                <p style={{ opacity: 0.7 }}>
                  {alreadyResponded
                    ? "Você já respondeu para esta rodada."
                    : "O mestre ainda não abriu a pergunta sobre cartas desta rodada."}
                </p>
              )}
            </div>
          );
        })}

        {inAuctionPhase && eligibleForThisAuction && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">Leilão — {ROUND_LABELS[currentRoundKey]}</div>
            {auction.prizeRevealed && (
              <p>
                <strong>Prêmio:</strong> {prizes[currentRoundKey]}
              </p>
            )}
            <Countdown endsAt={auction.endsAt} offset={offset} onComplete={() => {}} />

            {stage === "fixedBet" && (
              <>
                <p style={{ fontSize: "0.85rem" }}>
                  🔒 Fase de aposta fixa: cada país pode dar 1 lance único e secreto, sem saber o dos outros.
                </p>
                {ownBidsCount > 0 ? (
                  <p style={{ opacity: 0.7 }}>Sua aposta fixa já foi enviada. Aguarde a próxima fase.</p>
                ) : (
                  <form onSubmit={handleBid} style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <input
                      type="number"
                      min={MIN_BID_INCREMENT}
                      max={balance}
                      step={50}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Sua aposta"
                    />
                    <button className="btn btn-primary" type="submit" disabled={onCooldown}>
                      {onCooldown ? "Aguarde..." : "Enviar aposta fixa"}
                    </button>
                  </form>
                )}
              </>
            )}

            {stage === "locked" && (
              <p style={{ fontSize: "0.9rem", marginTop: 10 }}>
                🔒 Lances travados neste momento — aguarde a fase de novos lances abrir.
              </p>
            )}

            {stage === "newBids" && (
              <>
                <p style={{ fontSize: "0.85rem" }}>
                  {revealed ? "Lances revelados agora!" : "Leilão às cegas: os lances estão ocultos no momento."}
                </p>
                <BidList bids={bids} revealed={revealed} />
                {canAffordMinBid ? (
                  <form onSubmit={handleBid} style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <input
                      type="number"
                      min={revealed ? minNextBid : MIN_BID_INCREMENT}
                      max={balance}
                      step={50}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <button className="btn btn-primary" type="submit" disabled={onCooldown}>
                      {onCooldown ? "Aguarde..." : "Dar lance"}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: "var(--negative)", marginTop: 12 }}>
                    Seu saldo ({balance.toLocaleString("pt-BR")}) pode não ser suficiente pra continuar dando lances.
                  </p>
                )}
                <p style={{ fontSize: "0.8rem", marginTop: 6 }}>
                  {revealed
                    ? `Lance mínimo: ${minNextBid.toLocaleString("pt-BR")} moedas.`
                    : "O valor mínimo do lance está oculto — supere o lance mais alto atual (você não sabe qual é)."}{" "}
                  Máximo: seu saldo atual ({balance.toLocaleString("pt-BR")}).
                </p>
              </>
            )}

            {bidError && <p style={{ color: "var(--negative)" }}>{bidError}</p>}
          </div>
        )}

        {history.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">Histórico das rodadas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((h) => (
                <div key={h.roundKey} className="card" style={{ padding: 14 }}>
                  <strong>{ROUND_LABELS[h.roundKey]}</strong>
                  <p style={{ margin: "4px 0" }}>Evento: {h.eventName || "-"}</p>
                  <p style={{ margin: "4px 0" }}>
                    PIB recebido: <span className="money positive">+{h.gdpCredited.toLocaleString("pt-BR")}</span>
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    Leilão:{" "}
                    {h.auctionWon
                      ? `venceu, pagou ${h.amountPaid.toLocaleString("pt-BR")}`
                      : h.auctionParticipated
                      ? "participou, não venceu"
                      : "não participou"}
                  </p>
                  <p style={{ margin: "4px 0" }}>Inflação aplicada: {h.inflationRate}%</p>
                  {(h.cardsRevealed || []).map((cr, i) => (
                    <p key={i} style={{ margin: "4px 0", color: "var(--accent)" }}>
                      {cr.name}: {cr.effectText}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
