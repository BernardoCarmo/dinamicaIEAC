import { AnimatePresence, motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

export default function CardsPhase({ round, roundLabel }) {
  const responses = round?.cardQuestion?.responses || {};

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Decisões sobre cartas especiais</div>
      <p>Os líderes estão decidindo se usam sua carta especial antes do leilão...</p>
      <div className="grid-countries">
        {COUNTRIES.map((c) => {
          const used = Object.values(responses[c.id] || {}).some((v) => v === true);
          return (
            <div key={c.id} className="card" style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="flag">{c.flag}</span>
                <strong>{c.name}</strong>
              </div>
              <AnimatePresence>
                {used && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ marginTop: 10, fontSize: "1.6rem" }}
                    title="Carta usada"
                  >
                    🂠 <span style={{ fontSize: "0.85rem", color: "var(--accent)" }}>carta usada</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
