import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseValue } from "../hooks/useFirebaseValue";
import { useServerTimeOffset } from "../hooks/useServerTimeOffset";
import { COUNTRIES, ROUND_LABELS, PRIZES } from "../config/gameConfig";
import {
  drawCountries,
  finishCardDeal,
  revealEvent,
  creditGdp,
  askCardQuestion,
  prepareAuction,
  startAuctionTimer,
  revealPrize,
  finalizeAuction,
  applyInflation,
  revealRanking,
  advanceRound,
  nextPreliminaryRound,
  computeFinalistsAction,
  startFinal,
  endGame,
  resetGame,
  setPrizes,
} from "../engine/firebaseActions";
import { useRemainingMs } from "../hooks/useRemainingMs";
import { getAuctionStage } from "../engine/gameEngine";
import FlagBadge from "../components/shared/FlagBadge.jsx";
import CountUpNumber from "../components/shared/CountUpNumber.jsx";
import Countdown from "../components/shared/Countdown.jsx";
import BidList from "../components/shared/BidList.jsx";

const STAGE_LABELS = {
  fixedBet: "Fase de aposta fixa (lance único e secreto)",
  locked: "Travado (aguardando abrir novos lances)",
  newBids: "Novos lances liberados",
};

const PRIZE_FIELDS = [
  { key: "r1", label: "Rodada 1" },
  { key: "r2", label: "Rodada 2" },
  { key: "r3", label: "Rodada 3" },
  { key: "final", label: "Final" },
  { key: "wealth", label: "Campeão de Riqueza Real" },
];

export default function MasterPanelPage() {
  const navigate = useNavigate();
  const [session] = useFirebaseValue("session");
  const offset = useServerTimeOffset();
  const [prizeDraft, setPrizeDraft] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("isMestre") !== "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (prizeDraft === null && session) {
      setPrizeDraft(session.prizes || PRIZES);
    }
  }, [session, prizeDraft]);

  const currentRoundKey = session?.currentRoundKey;
  const roundPhase = session?.roundPhase;
  const round = currentRoundKey ? session?.rounds?.[currentRoundKey] : null;
  const auction = round?.auction;
  const auctionRemainingMs = useRemainingMs(auction?.endsAt, offset);
  const auctionStage = getAuctionStage(Math.ceil(auctionRemainingMs / 1000));

  // Finaliza o leilão automaticamente quando o cronômetro chega a zero — o
  // mestre só clica em "começar cronômetro", o resto é automático.
  useEffect(() => {
    if (roundPhase !== "auction" || !auction?.active) return;
    const id = setInterval(() => {
      const now = Date.now() + offset;
      if (auction.endsAt != null && now >= auction.endsAt) {
        finalizeAuction(currentRoundKey);
      }
    }, 500);
    return () => clearInterval(id);
  }, [roundPhase, auction, offset, currentRoundKey]);

  const leaderCount = session ? Object.keys(session.leaders || {}).length : 0;

  const eligibleCardCountries = useMemo(
    () =>
      COUNTRIES.filter((c) =>
        c.cards.some((card) => !session?.countries?.[c.id]?.cardsUsed?.[card.id])
      ),
    [session]
  );

  if (!session) {
    return (
      <div className="page">
        <p>Carregando painel...</p>
      </div>
    );
  }

  async function handleReset() {
    if (window.confirm("Tem certeza? Isso apaga todo o progresso da partida atual.")) {
      await resetGame();
      setPrizeDraft(null);
    }
  }

  function openTelao() {
    window.open("#/telao", "_blank");
  }

  async function handleSavePrizes() {
    await setPrizes(prizeDraft);
  }

  const nextRound = currentRoundKey ? nextPreliminaryRound(currentRoundKey) : null;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Painel do mestre</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={openTelao}>
              Abrir telão (2ª janela)
            </button>
            <button className="btn btn-danger" onClick={handleReset}>
              Reiniciar jogo
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Prêmios das etapas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRIZE_FIELDS.map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: "0.85rem", opacity: 0.8 }}>{f.label}</label>
                <input
                  type="text"
                  value={prizeDraft?.[f.key] ?? ""}
                  onChange={(e) => setPrizeDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <button className="btn btn-primary" onClick={handleSavePrizes} style={{ alignSelf: "flex-start" }}>
              Salvar prêmios
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Saldos ao vivo (só você vê os valores)</div>
          <div className="grid-countries">
            {COUNTRIES.map((c) => {
              const cardsUsed = session.countries?.[c.id]?.cardsUsed || {};
              const anyCardUsed = c.cards.some((card) => cardsUsed[card.id]);
              return (
                <div key={c.id} className="card" style={{ padding: 14 }}>
                  <FlagBadge country={c} />
                  <div style={{ marginTop: 10, fontSize: "1.4rem" }}>
                    <CountUpNumber value={session.countries?.[c.id]?.balance ?? 0} className="money positive" />
                  </div>
                  {anyCardUsed && <div style={{ fontSize: "0.75rem", color: "var(--accent)" }}>carta usada</div>}
                </div>
              );
            })}
          </div>
        </div>

        {session.phase === "login" && (
          <div className="card">
            <div className="section-title">Sorteio inicial</div>
            <p>Líderes conectados: {leaderCount}/6</p>
            <button className="btn btn-primary" disabled={leaderCount < 6} onClick={drawCountries}>
              Sortear países
            </button>
          </div>
        )}

        {session.phase === "playing" && (
          <div className="card">
            <div className="section-title">
              {ROUND_LABELS[currentRoundKey]} — fase: {roundPhase}
            </div>

            {roundPhase === "cardDeal" && (
              <div>
                <p>Telão está mostrando a animação de distribuição das cartas especiais.</p>
                <button className="btn btn-primary" onClick={finishCardDeal}>
                  Continuar para a Rodada 1
                </button>
              </div>
            )}

            {roundPhase === "idle" && currentRoundKey !== "final" && (
              <button className="btn btn-primary" onClick={() => revealEvent(currentRoundKey)}>
                Sortear evento
              </button>
            )}

            {roundPhase === "vs" && currentRoundKey === "final" && (
              <div>
                <p>
                  Confronto final: {session.finalists?.map((id) => COUNTRIES.find((c) => c.id === id)?.name).join(" x ")}
                </p>
                <button className="btn btn-primary" onClick={() => revealEvent("final")}>
                  Continuar para o evento da final
                </button>
              </div>
            )}

            {roundPhase === "event" && round?.event && (
              <div>
                <h3>{round.event.name}</h3>
                <p>{round.event.description}</p>
                <button className="btn btn-primary" onClick={() => askCardQuestion(currentRoundKey)}>
                  Perguntar sobre cartas
                </button>
              </div>
            )}

            {roundPhase === "cardQuestion" && (
              <div>
                <p>
                  Respostas: {Object.keys(round?.cardQuestion?.responses || {}).length}/
                  {eligibleCardCountries.length} países com carta disponível
                </p>
                <button className="btn btn-primary" onClick={() => creditGdp(currentRoundKey)}>
                  Creditar PIB
                </button>
              </div>
            )}

            {roundPhase === "gdp" && round?.gdpAmounts && (
              <div>
                <div className="grid-countries" style={{ marginBottom: 14 }}>
                  {COUNTRIES.map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{c.flag} {c.name}</span>
                      <span className="money positive">+{round.gdpAmounts[c.id]}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => prepareAuction(currentRoundKey)}>
                  Ir para os bastidores do leilão
                </button>
              </div>
            )}

            {roundPhase === "auctionIntro" && (
              <div>
                <p>Telão está mostrando o recap de ataques e ações da rodada.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {!auction?.prizeRevealed && (
                    <button className="btn" onClick={() => revealPrize(currentRoundKey)}>
                      Revelar prêmio
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => startAuctionTimer(currentRoundKey, offset)}>
                    Começar cronômetro do leilão
                  </button>
                </div>
              </div>
            )}

            {roundPhase === "auction" && auction && (
              <div>
                {auction.prizeRevealed && (
                  <p>
                    <strong>Prêmio:</strong> {session.prizes?.[currentRoundKey]}
                  </p>
                )}
                {!auction.prizeRevealed && (
                  <button className="btn" onClick={() => revealPrize(currentRoundKey)} style={{ marginBottom: 10 }}>
                    Revelar prêmio
                  </button>
                )}
                <p style={{ fontSize: "0.85rem", color: "var(--accent)" }}>{STAGE_LABELS[auctionStage]}</p>
                <Countdown endsAt={auction.endsAt} offset={offset} onComplete={() => finalizeAuction(currentRoundKey)} />
                <BidList bids={auction.bids} revealed />
                <button className="btn" style={{ marginTop: 10 }} onClick={() => finalizeAuction(currentRoundKey)}>
                  Finalizar leilão agora
                </button>
              </div>
            )}

            {roundPhase === "result" && round?.auction && (
              <div>
                <p>
                  {round.auction.winnerId
                    ? `Vencedor: ${COUNTRIES.find((c) => c.id === round.auction.winnerId)?.name} pagou ${round.auction.amountPaid}`
                    : "Ninguém deu lance — prêmio não entregue."}
                </p>
                <button className="btn btn-primary" onClick={() => applyInflation(currentRoundKey)}>
                  Aplicar inflação da rodada
                </button>
              </div>
            )}

            {roundPhase === "inflation" && round && (
              <div>
                <p>Inflação aplicada: {round.inflationRate}%</p>
                <button className="btn btn-primary" onClick={() => revealRanking(currentRoundKey)}>
                  Revelar ranking
                </button>
              </div>
            )}

            {roundPhase === "ranking" && (
              <div>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  (Só você vê os valores abaixo — no telão da turma o ranking aparece sem saldo, e a Rodada 3 nem
                  mostra o ranking, pra manter o suspense até a final.)
                </p>
                <ol>
                  {(session.ranking || []).map((id) => {
                    const c = COUNTRIES.find((x) => x.id === id);
                    return (
                      <li key={id}>
                        {c.flag} {c.name} — {session.countries[id].balance.toLocaleString("pt-BR")}
                      </li>
                    );
                  })}
                </ol>
                {nextRound && (
                  <button className="btn btn-primary" onClick={() => advanceRound(nextRound)}>
                    Avançar para {ROUND_LABELS[nextRound]}
                  </button>
                )}
                {currentRoundKey === "r3" && (
                  <button className="btn btn-primary" onClick={computeFinalistsAction}>
                    Apurar finalistas
                  </button>
                )}
                {currentRoundKey === "final" && (
                  <button className="btn btn-primary" onClick={endGame}>
                    Encerrar jogo
                  </button>
                )}
              </div>
            )}

            {roundPhase === "finalistPick" && (
              <div>
                <p>
                  Finalistas (apurados automaticamente): {" "}
                  {session.finalists?.map((id) => COUNTRIES.find((c) => c.id === id)?.name).join(" x ")}
                </p>
                <button className="btn btn-primary" onClick={startFinal}>
                  Iniciar Final
                </button>
              </div>
            )}
          </div>
        )}

        {session.phase === "ended" && (
          <div className="card">
            <div className="section-title">Jogo encerrado</div>
            <p>Campeão da Final: {COUNTRIES.find((c) => c.id === session.champion)?.name || "-"}</p>
            <p>Campeão de Riqueza Real: {COUNTRIES.find((c) => c.id === session.wealthChampion)?.name || "-"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
