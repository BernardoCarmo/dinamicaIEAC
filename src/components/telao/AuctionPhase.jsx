import { useRemainingMs } from "../../hooks/useRemainingMs";
import { getAuctionStage } from "../../engine/gameEngine";
import Countdown from "../shared/Countdown.jsx";
import BidList from "../shared/BidList.jsx";

export default function AuctionPhase({ round, roundLabel, offset, prizeText }) {
  const auction = round?.auction;
  const remainingMs = useRemainingMs(auction?.endsAt, offset);
  if (!auction) return null;

  const remainingSec = Math.ceil(remainingMs / 1000);
  const stage = getAuctionStage(remainingSec);

  return (
    <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Leilão ao vivo</div>
      {auction.prizeRevealed && <h2 style={{ marginBottom: 20 }}>Prêmio: {prizeText}</h2>}
      <Countdown big endsAt={auction.endsAt} offset={offset} />

      {stage === "blind" ? (
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>
          🔒 Fase às cegas: cada país pode dar 1 lance único e secreto quando quiser.
        </p>
      ) : (
        <>
          <p style={{ opacity: 0.8 }}>Valores revelados — todo mundo pode dar novos lances!</p>
          <div style={{ marginTop: 20 }}>
            <BidList bids={auction.bids} revealed />
          </div>
        </>
      )}
    </div>
  );
}
