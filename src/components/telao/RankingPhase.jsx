import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";
import CountUpNumber from "../shared/CountUpNumber.jsx";

export default function RankingPhase({ round, countries, ranking, roundKey, roundLabel }) {
  const before = round?.balancesBeforeRanking || {};
  const preOrder = [...COUNTRIES.map((c) => c.id)].sort(
    (a, b) => (before[b] ?? 0) - (before[a] ?? 0)
  );
  const finalOrder = ranking && ranking.length === 6 ? ranking : preOrder;

  const [order, setOrder] = useState(preOrder);

  useEffect(() => {
    setOrder(preOrder);
    const t = setTimeout(() => setOrder(finalOrder), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <div className="section-title" style={{ textAlign: "center" }}>
        {roundLabel} — Ranking
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.map((id, idx) => {
          const c = COUNTRIES.find((x) => x.id === id);
          const cardRevealed = countries?.[id]?.history?.[roundKey]?.cardRevealed;
          return (
            <motion.div
              key={id}
              layout
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="card"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <strong style={{ width: 24 }}>{idx + 1}º</strong>
                <span className="flag">{c.flag}</span>
                <span>{c.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <CountUpNumber
                  value={countries?.[id]?.balance ?? 0}
                  initialValue={before[id] ?? 0}
                  className="money positive"
                  duration={1000}
                />
                {cardRevealed && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
                    {cardRevealed.name}: {cardRevealed.effectText}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
