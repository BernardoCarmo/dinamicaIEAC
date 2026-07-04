import { useRemainingMs } from "../../hooks/useRemainingMs";
import { isBidRevealed } from "../../engine/gameEngine";
import Countdown from "../shared/Countdown.jsx";
import BidList from "../shared/BidList.jsx";

export default function AuctionPhase({ round, roundKey, roundLabel, offset, prizeText }) {
  const auction = round?.auction;
  const remainingMs = useRemainingMs(auction?.endsAt, offset);
  if (!auction) return null;

  const isFinal = roundKey === "final";
  const revealed = isBidRevealed(Math.ceil(remainingMs / 1000), isFinal);

  return (
    <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Leilão ao vivo</div>
      {auction.prizeRevealed && <h2 style={{ marginBottom: 20 }}>Prêmio: {prizeText}</h2>}
      <Countdown big endsAt={auction.endsAt} offset={offset} />
      <p style={{ opacity: 0.8 }}>
        {revealed ? "Lances revelados!" : "Lances ocultos — só aparecem em certos momentos."}
      </p>
      <div style={{ marginTop: 20 }}>
        <BidList bids={auction.bids} revealed={revealed} />
      </div>
    </div>
  );
}
