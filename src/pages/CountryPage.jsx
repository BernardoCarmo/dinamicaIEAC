import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseValue } from "../hooks/useFirebaseValue";
import { useServerTimeOffset } from "../hooks/useServerTimeOffset";
import {
  COUNTRIES,
  PRIZES,
  MIN_BID_INCREMENT,
  ROUND_KEYS,
  ROUND_LABELS,
  FINAL_AUCTION_SILENCE_SEC,
} from "../config/gameConfig";
import { leaderDecideCard, placeBid } from "../engine/firebaseActions";
import CountUpNumber from "../components/shared/CountUpNumber.jsx";
import FlagBadge from "../components/shared/FlagBadge.jsx";
import Countdown from "../components/shared/Countdown.jsx";
import BidList from "../components/shared/BidList.jsx";

const CARD_ELIGIBLE_PHASES = ["idle", "event", "gdp", "cardQuestion"];

export default function CountryPage() {
  const navigate = useNavigate();
  const leaderId = localStorage.getItem("leaderId");
  const [session] = useFirebaseValue("session");
  const offset = useServerTimeOffset();
  const [bidAmount, setBidAmount] = useState(0);
  const [bidError, setBidError] = useState("");

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
  const bids = auction?.bids || {};
  const highestBid = Object.values(bids).reduce((max, b) => Math.max(max, b.amount), 0);
  const minNextBid = highestBid + MIN_BID_INCREMENT;

  useEffect(() => {
    setBidAmount(minNextBid);
  }, [minNextBid, currentRoundKey]);

  if (!session || !countryConfig || !countryState) {
    return (
      <div className="page">
        <p>Carregando seu país...</p>
      </div>
    );
  }

  const isFinalRound = currentRoundKey === "final";
  const finalists = session.finalists || [];
  const isFinalist = finalists.includes(countryId);

  let statusLabel = "Ativo na disputa";
  if (session.phase === "ended") {
    if (session.champion === countryId) statusLabel = "Campeão da Final!";
    else if (session.wealthChampion === countryId) statusLabel = "Campeão de Riqueza Real!";
    else statusLabel = "Jogo encerrado";
  } else if (isFinalRound) {
    statusLabel = isFinalist ? "Na disputa da Final" : "Fora dos leilões, seguindo pela riqueza real";
  } else if (session.finalists && !isFinalist) {
    statusLabel = "Fora dos leilões, seguindo pela riqueza real";
  } else if (session.finalists && isFinalist) {
    statusLabel = "Classificado para a final";
  }

  const cardUsed = countryState.cardUsed;
  const canDecideCardNow =
    !cardUsed && currentRoundKey && CARD_ELIGIBLE_PHASES.includes(roundPhase);
  const alreadyResponded = round?.cardQuestion?.responses?.[countryId] !== undefined;
  const cardQuestionActive = round?.cardQuestion?.active && !alreadyResponded && canDecideCardNow;

  const inAuctionPhase = roundPhase === "auction" && auction?.active;
  const eligibleForThisAuction = !isFinalRound || isFinalist;

  async function handleUseCard() {
    if (!window.confirm(`Usar agora a carta "${countryConfig.card.name}"? Isso só pode ser feito uma vez em todo o jogo.`)) {
      return;
    }
    await leaderDecideCard(currentRoundKey, countryId, true);
  }

  async function handleDeclineCard() {
    await leaderDecideCard(currentRoundKey, countryId, false);
  }

  async function handleBid(e) {
    e.preventDefault();
    setBidError("");
    try {
      await placeBid(currentRoundKey, countryId, Number(bidAmount), offset);
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
              <CountUpNumber value={countryState.balance} className="money positive" />
            </div>
          </div>
          <div className="badge" style={{ background: "var(--bg-panel)", color: "var(--text)", marginTop: 6 }}>
            {statusLabel}
          </div>
        </div>

        {!cardUsed && (
          <div className="card" style={{ marginTop: 16, borderColor: cardQuestionActive ? "var(--accent)" : undefined }}>
            <div className="section-title">Sua carta especial</div>
            <h3>{countryConfig.card.name}</h3>
            <p>{countryConfig.card.narrative}</p>
            <p>
              <strong>Efeito:</strong> {countryConfig.card.effectText}
            </p>
            {cardQuestionActive && (
              <p style={{ color: "var(--accent)" }}>
                O mestre está perguntando: usar a carta agora, antes do leilão desta rodada?
              </p>
            )}
            {canDecideCardNow && !alreadyResponded ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={handleUseCard}>
                  Usar carta agora
                </button>
                {round?.cardQuestion?.active && (
                  <button className="btn" onClick={handleDeclineCard}>
                    Não usar agora
                  </button>
                )}
              </div>
            ) : (
              <p style={{ opacity: 0.7 }}>
                {alreadyResponded ? "Você já respondeu para esta rodada." : "Disponível antes do próximo leilão."}
              </p>
            )}
          </div>
        )}

        {inAuctionPhase && eligibleForThisAuction && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">Leilão — {ROUND_LABELS[currentRoundKey]}</div>
            {auction.prizeRevealed && (
              <p>
                <strong>Prêmio:</strong> {PRIZES[currentRoundKey]}
              </p>
            )}
            <Countdown
              endsAt={
                isFinalRound
                  ? (auction.lastBidAt || 0) + FINAL_AUCTION_SILENCE_SEC * 1000
                  : auction.endsAt
              }
              offset={offset}
              onComplete={() => {}}
            />
            {isFinalRound && (
              <p style={{ fontSize: "0.85rem" }}>
                O leilão da final termina quando passarem 20s sem lance novo.
              </p>
            )}
            <BidList bids={bids} />
            <form onSubmit={handleBid} style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input
                type="number"
                min={minNextBid}
                step={50}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                Dar lance
              </button>
            </form>
            <p style={{ fontSize: "0.8rem", marginTop: 6 }}>
              Lance mínimo: {minNextBid.toLocaleString("pt-BR")} moedas.
            </p>
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
                  {h.cardRevealed && (
                    <p style={{ margin: "4px 0", color: "var(--accent)" }}>
                      Carta usada: {h.cardRevealed.name} — {h.cardRevealed.effectText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
