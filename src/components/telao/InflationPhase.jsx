import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

// Não mostra nenhum valor numérico de saldo aqui — só a taxa de inflação (que
// é pública/igual pra rodada) e a confirmação de que foi aplicada a todos.
export default function InflationPhase({ round, roundLabel }) {
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div className="section-title">
        {roundLabel} — Inflação de {round?.inflationRate}%
      </div>
      <div className="grid-countries">
        {COUNTRIES.map((c, i) => (
          <motion.div
            key={c.id}
            className="card"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ scale: [1, 0.94, 1] }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span className="flag">{c.flag}</span>
              <strong>{c.name}</strong>
            </div>
            <div style={{ fontSize: "1.6rem", marginTop: 8 }}>📉</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
