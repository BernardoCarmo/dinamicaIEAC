import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

export default function RankingPhase({ round, countries, ranking, roundKey, roundLabel }) {
  const before = round?.balancesBeforeRanking || {};
  const preOrder = [...COUNTRIES.map((c) => c.id)].sort(
    (a, b) => (before[b] ?? 0) - (before[a] ?? 0)
  );
  const finalOrder = ranking && ranking.length === 6 ? ranking : preOrder;

  const [order, setOrder] = useState(preOrder);
  const sabotage = round?.sabotage;
  const attacker = sabotage && COUNTRIES.find((c) => c.id === sabotage.attackerId);
  const target = sabotage && COUNTRIES.find((c) => c.id === sabotage.targetId);

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
      <p style={{ textAlign: "center", fontSize: "0.85rem" }}>
        Quem sobe, quem desce — os saldos continuam em segredo até o fim do jogo.
      </p>

      {sabotage && (
        <motion.div
          className="card"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140 }}
          style={{ textAlign: "center", marginBottom: 20, borderColor: "var(--negative)" }}
        >
          <div style={{ fontSize: "2.4rem" }}>
            {attacker?.flag} ⚔️ {target?.flag}
          </div>
          <h3 style={{ color: "var(--negative)" }}>Sabotagem de PIB!</h3>
          <p>
            {attacker?.name} atacou {target?.name}, cortando 30% do PIB desta rodada.
          </p>
        </motion.div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.map((id, idx) => {
          const c = COUNTRIES.find((x) => x.id === id);
          const cardsRevealed = countries?.[id]?.history?.[roundKey]?.cardsRevealed || [];
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
                {cardsRevealed.map((cr, i) => (
                  <div key={i} style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
                    {cr.name}: {cr.effectText}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
