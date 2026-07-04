import { PRIZES, FINAL_AUCTION_SILENCE_SEC } from "../../config/gameConfig";
import Countdown from "../shared/Countdown.jsx";
import BidList from "../shared/BidList.jsx";

export default function AuctionPhase({ round, roundKey, roundLabel, offset, isFinalRound }) {
  const auction = round?.auction;
  if (!auction) return null;

  return (
    <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Leilão ao vivo</div>
      {auction.prizeRevealed && (
        <h2 style={{ marginBottom: 20 }}>Prêmio: {PRIZES[roundKey]}</h2>
      )}
      <Countdown
        big
        endsAt={isFinalRound ? (auction.lastBidAt || 0) + FINAL_AUCTION_SILENCE_SEC * 1000 : auction.endsAt}
        offset={offset}
      />
      <div style={{ marginTop: 20 }}>
        <BidList bids={auction.bids} />
      </div>
    </div>
  );
}
