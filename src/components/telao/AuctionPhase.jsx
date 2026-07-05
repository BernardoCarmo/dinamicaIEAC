import { useRemainingMs } from "../../hooks/useRemainingMs";
import { isBidRevealed, getAuctionStage } from "../../engine/gameEngine";
import Countdown from "../shared/Countdown.jsx";
import BidList from "../shared/BidList.jsx";

const STAGE_MESSAGES = {
  fixedBet: "🔒 Fase de aposta fixa: cada país está dando 1 lance único e secreto.",
  locked: "🔒 Lances travados — aguarde, os novos lances abrem em instantes.",
};

export default function AuctionPhase({ round, roundLabel, offset, prizeText }) {
  const auction = round?.auction;
  const remainingMs = useRemainingMs(auction?.endsAt, offset);
  if (!auction) return null;

  const remainingSec = Math.ceil(remainingMs / 1000);
  const stage = getAuctionStage(remainingSec);
  const revealed = isBidRevealed(remainingSec);

  return (
    <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Leilão ao vivo</div>
      {auction.prizeRevealed && <h2 style={{ marginBottom: 20 }}>Prêmio: {prizeText}</h2>}
      <Countdown big endsAt={auction.endsAt} offset={offset} />

      {stage !== "newBids" ? (
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>{STAGE_MESSAGES[stage]}</p>
      ) : (
        <>
          <p style={{ opacity: 0.8 }}>
            {revealed ? "Lances revelados!" : "Lances liberados, mas ainda ocultos — só aparecem em instantes."}
          </p>
          <div style={{ marginTop: 20 }}>
            <BidList bids={auction.bids} revealed={revealed} />
          </div>
        </>
      )}
    </div>
  );
}
