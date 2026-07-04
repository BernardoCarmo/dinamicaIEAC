import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

// Fase cosmética: mostra as cartas "sendo embaralhadas e sorteadas" para dar
// suspense, mas o conteúdo nunca é revelado aqui (as cartas já são fixas por
// faixa — cada líder já vê a sua própria em segredo na tela do país).
export default function CardDealPhase() {
  const [dealt, setDealt] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDealt(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div className="section-title">Sorteio das cartas especiais</div>

      <AnimatePresence mode="wait">
        {!dealt ? (
          <motion.div
            key="shuffle"
            style={{ fontSize: "5rem", margin: "40px 0" }}
            animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            🎴
          </motion.div>
        ) : (
          <motion.h2 key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Cada país recebeu sua carta especial (em segredo)!
          </motion.h2>
        )}
      </AnimatePresence>

      <div className="grid-countries" style={{ marginTop: 20 }}>
        {COUNTRIES.map((c, i) => (
          <motion.div
            key={c.id}
            className="card"
            initial={{ y: -60, opacity: 0 }}
            animate={dealt ? { y: 0, opacity: 1 } : { y: -60, opacity: 0 }}
            transition={{ delay: dealt ? i * 0.12 : 0, type: "spring", stiffness: 160 }}
          >
            <div className="flag">{c.flag}</div>
            <strong>{c.name}</strong>
            <div style={{ fontSize: "2rem", marginTop: 6 }}>🂠</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
