import { useFirebaseValue } from "../hooks/useFirebaseValue";
import { useServerTimeOffset } from "../hooks/useServerTimeOffset";
import { COUNTRIES, ROUND_LABELS } from "../config/gameConfig";
import EventPhase from "../components/telao/EventPhase.jsx";
import GdpPhase from "../components/telao/GdpPhase.jsx";
import CardsPhase from "../components/telao/CardsPhase.jsx";
import AuctionIntroPhase from "../components/telao/AuctionIntroPhase.jsx";
import AuctionPhase from "../components/telao/AuctionPhase.jsx";
import ResultPhase from "../components/telao/ResultPhase.jsx";
import InflationPhase from "../components/telao/InflationPhase.jsx";
import RankingPhase from "../components/telao/RankingPhase.jsx";
import VsScreen from "../components/telao/VsScreen.jsx";
import ClosingScreen from "../components/telao/ClosingScreen.jsx";
import CardDealPhase from "../components/telao/CardDealPhase.jsx";
import TutorialSlide from "../components/tutorial/TutorialSlide.jsx";
import { TUTORIAL_SLIDES } from "../config/tutorialSlides";

const PREVIOUS_ROUND = { r2: "r1", r3: "r2", final: "r3" };

export default function TelaoPage() {
  const [session] = useFirebaseValue("session");
  const offset = useServerTimeOffset();

  if (!session) {
    return (
      <div className="page" style={{ justifyContent: "center" }}>
        <p>Carregando telão...</p>
      </div>
    );
  }

  const currentRoundKey = session.currentRoundKey;
  const roundPhase = session.roundPhase;
  const round = currentRoundKey ? session.rounds?.[currentRoundKey] : null;
  const roundLabel = currentRoundKey ? ROUND_LABELS[currentRoundKey] : "";
  const prizes = session.prizes || {};

  let content = null;

  if (session.phase === "login" && session.tutorialSlide != null) {
    content = (
      <TutorialSlide
        slide={TUTORIAL_SLIDES[session.tutorialSlide]}
        index={session.tutorialSlide}
        total={TUTORIAL_SLIDES.length}
      />
    );
  } else if (session.phase === "login") {
    const leaders = Object.values(session.leaders || {});
    content = (
      <div style={{ textAlign: "center" }}>
        <h1>PIB, Inflação e Leilão</h1>
        <p style={{ fontSize: "1.4rem" }}>Aguardando líderes entrarem... ({leaders.length}/6)</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          {leaders.map((l, i) => (
            <div key={i} className="card">
              {l.name}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (session.phase === "playing" && roundPhase === "cardDeal") {
    content = <CardDealPhase />;
  } else if (session.phase === "playing" && currentRoundKey === "r1" && roundPhase === "idle") {
    content = (
      <div style={{ textAlign: "center" }}>
        <h1>Escalação sorteada!</h1>
        <div className="grid-countries" style={{ marginTop: 20 }}>
          {COUNTRIES.map((c) => {
            const entry = Object.entries(session.assignment || {}).find(([cid]) => cid === c.id);
            const leaderName = entry ? session.leaders?.[entry[1]]?.name : "-";
            return (
              <div key={c.id} className="card">
                <div className="flag">{c.flag}</div>
                <strong>{c.name}</strong>
                <div style={{ color: "var(--text-dim)" }}>{leaderName}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (roundPhase === "vs") {
    content = <VsScreen finalists={session.finalists} />;
  } else if (roundPhase === "event") {
    content = <EventPhase event={round?.event} roundLabel={roundLabel} />;
  } else if (roundPhase === "gdp") {
    content = <GdpPhase roundLabel={roundLabel} />;
  } else if (roundPhase === "cardQuestion") {
    content = <CardsPhase round={round} roundLabel={roundLabel} />;
  } else if (roundPhase === "auctionIntro") {
    const prevKey = PREVIOUS_ROUND[currentRoundKey];
    const prevRound = prevKey ? session.rounds?.[prevKey] : null;
    const previousRoundSummary =
      prevRound?.winnerId != null
        ? {
            roundLabel: ROUND_LABELS[prevKey],
            winnerName: COUNTRIES.find((c) => c.id === prevRound.winnerId)?.name,
            amountPaid: prevRound.auction?.amountPaid ?? 0,
            prizeText: prizes[prevKey],
          }
        : null;
    content = (
      <AuctionIntroPhase
        round={round}
        countries={session.countries}
        roundKey={currentRoundKey}
        roundLabel={roundLabel}
        previousRoundSummary={previousRoundSummary}
      />
    );
  } else if (roundPhase === "auction") {
    content = (
      <AuctionPhase
        round={round}
        roundKey={currentRoundKey}
        roundLabel={roundLabel}
        offset={offset}
        prizeText={prizes[currentRoundKey]}
      />
    );
  } else if (roundPhase === "result") {
    content = <ResultPhase round={round} roundLabel={roundLabel} prizeText={prizes[currentRoundKey]} />;
  } else if (roundPhase === "inflation") {
    content = (
      <InflationPhase round={round} countries={session.countries} roundKey={currentRoundKey} roundLabel={roundLabel} />
    );
  } else if (roundPhase === "ranking" && currentRoundKey === "r3") {
    // Suspense proposital: não mostramos o ranking da Rodada 3, só o anúncio
    // dos finalistas em seguida — ninguém sabe quem está rico até a final.
    content = (
      <div style={{ textAlign: "center" }}>
        <h2>Rodada 3 encerrada!</h2>
        <p style={{ fontSize: "1.2rem" }}>Os saldos continuam em segredo... apurando os finalistas.</p>
      </div>
    );
  } else if (roundPhase === "ranking") {
    content = (
      <RankingPhase
        round={round}
        countries={session.countries}
        ranking={session.ranking}
        roundKey={currentRoundKey}
        roundLabel={roundLabel}
      />
    );
  } else if (roundPhase === "finalistPick") {
    content = (
      <div style={{ textAlign: "center" }}>
        <h2>Apurando os finalistas...</h2>
        <p>Aguarde o mestre.</p>
      </div>
    );
  }

  if (session.phase === "ended") {
    content = <ClosingScreen session={session} />;
  }

  return (
    <div className="page" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        {content}
      </div>
    </div>
  );
}
