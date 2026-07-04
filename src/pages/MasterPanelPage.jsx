import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseValue } from "../hooks/useFirebaseValue";
import { useServerTimeOffset } from "../hooks/useServerTimeOffset";
import { COUNTRIES, PRIZES, ROUND_LABELS, FINAL_AUCTION_SILENCE_SEC } from "../config/gameConfig";
import {
  drawCountries,
  revealEvent,
  creditGdp,
  askCardQuestion,
  startAuction,
  revealPrize,
  finalizeAuction,
  applyInflation,
  revealRanking,
  advanceToRound2,
  computeFinalistsAction,
  manuallyPickFinalists,
  startFinal,
  endGame,
  resetGame,
} from "../engine/firebaseActions";
import FlagBadge from "../components/shared/FlagBadge.jsx";
import CountUpNumber from "../components/shared/CountUpNumber.jsx";
import Countdown from "../components/shared/Countdown.jsx";
import BidList from "../components/shared/BidList.jsx";

export default function MasterPanelPage() {
  const navigate = useNavigate();
  const [session] = useFirebaseValue("session");
  const offset = useServerTimeOffset();
  const [manualPicks, setManualPicks] = useState([]);

  useEffect(() => {
    if (sessionStorage.getItem("isMestre") !== "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const currentRoundKey = session?.currentRoundKey;
  const roundPhase = session?.roundPhase;
  const round = currentRoundKey ? session?.rounds?.[currentRoundKey] : null;
  const auction = round?.auction;
  const isFinalRound = currentRoundKey === "final";

  // Finaliza o leilão automaticamente quando o cronômetro chega a zero (rodadas
  // normais) ou quando passam 20s sem lance novo (final) — o mestre só clica em
  // "iniciar leilão", o resto é automático, como pede a especificação.
  useEffect(() => {
    if (roundPhase !== "auction" || !auction?.active) return;
    const id = setInterval(() => {
      const now = Date.now() + offset;
      if (isFinalRound) {
        const lastBidAt = auction.lastBidAt || now;
        if (now - lastBidAt >= FINAL_AUCTION_SILENCE_SEC * 1000) {
          finalizeAuction(currentRoundKey);
        }
      } else if (auction.endsAt != null && now >= auction.endsAt) {
        finalizeAuction(currentRoundKey);
      }
    }, 500);
    return () => clearInterval(id);
  }, [roundPhase, auction, offset, isFinalRound, currentRoundKey]);

  const leaderCount = session ? Object.keys(session.leaders || {}).length : 0;

  const eligibleCardCountries = useMemo(
    () => COUNTRIES.filter((c) => !session?.countries?.[c.id]?.cardUsed),
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
      setManualPicks([]);
    }
  }

  function openTelao() {
    window.open("#/telao", "_blank");
  }

  async function handleManualConfirm() {
    const fixed = session.finalists && session.finalists.length === 1 ? session.finalists : [];
    const finalIds = [...fixed, ...manualPicks].slice(0, 2);
    if (finalIds.length === 2) {
      await manuallyPickFinalists(finalIds);
      setManualPicks([]);
    }
  }

  function toggleManualPick(id) {
    setManualPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const fixed = session.finalists && session.finalists.length === 1 ? 1 : 0;
      const room = 2 - fixed;
      if (prev.length >= room) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

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
          <div className="section-title">Saldos ao vivo</div>
          <div className="grid-countries">
            {COUNTRIES.map((c) => (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <FlagBadge country={c} />
                <div style={{ marginTop: 10, fontSize: "1.4rem" }}>
                  <CountUpNumber value={session.countries?.[c.id]?.balance ?? 0} className="money positive" />
                </div>
                {session.countries?.[c.id]?.cardUsed && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent)" }}>carta usada</div>
                )}
              </div>
            ))}
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

            {roundPhase === "idle" && !isFinalRound && (
              <button className="btn btn-primary" onClick={() => revealEvent(currentRoundKey)}>
                Sortear evento
              </button>
            )}

            {roundPhase === "vs" && isFinalRound && (
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
                <div style={{ display: "flex", gap: 10 }}>
                  {!auction?.prizeRevealed && (
                    <button className="btn" onClick={() => revealPrize(currentRoundKey)}>
                      Revelar prêmio
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => startAuction(currentRoundKey, offset)}>
                    Iniciar leilão
                  </button>
                </div>
              </div>
            )}

            {roundPhase === "auction" && auction && (
              <div>
                {auction.prizeRevealed && (
                  <p>
                    <strong>Prêmio:</strong> {PRIZES[currentRoundKey]}
                  </p>
                )}
                {!auction.prizeRevealed && (
                  <button className="btn" onClick={() => revealPrize(currentRoundKey)} style={{ marginBottom: 10 }}>
                    Revelar prêmio
                  </button>
                )}
                <Countdown
                  endsAt={isFinalRound ? (auction.lastBidAt || 0) + FINAL_AUCTION_SILENCE_SEC * 1000 : auction.endsAt}
                  offset={offset}
                  onComplete={() => finalizeAuction(currentRoundKey)}
                />
                <BidList bids={auction.bids} />
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
                {currentRoundKey === "r1" && (
                  <button className="btn btn-primary" onClick={advanceToRound2}>
                    Avançar para Rodada 2
                  </button>
                )}
                {currentRoundKey === "r2" && (
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
                {!session.finalistsNeedsManualPick ? (
                  <div>
                    <p>
                      Finalistas: {session.finalists?.map((id) => COUNTRIES.find((c) => c.id === id)?.name).join(" x ")}
                    </p>
                    <button className="btn btn-primary" onClick={startFinal}>
                      Iniciar Final
                    </button>
                  </div>
                ) : (
                  <div>
                    <p>
                      Empate ou dados insuficientes para apurar automaticamente. Escolha manualmente
                      {session.finalists?.length === 1
                        ? ` o 2º finalista (o 1º já é ${COUNTRIES.find((c) => c.id === session.finalists[0])?.name}):`
                        : " os 2 finalistas:"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(session.finalistCandidates || []).map((id) => {
                        const c = COUNTRIES.find((x) => x.id === id);
                        const selected = manualPicks.includes(id);
                        return (
                          <button
                            key={id}
                            className="btn"
                            style={{ background: selected ? "var(--accent-strong)" : undefined }}
                            onClick={() => toggleManualPick(id)}
                          >
                            {c.flag} {c.name}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 10 }}
                      disabled={
                        manualPicks.length + (session.finalists?.length === 1 ? 1 : 0) !== 2
                      }
                      onClick={handleManualConfirm}
                    >
                      Confirmar finalistas
                    </button>
                  </div>
                )}
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
