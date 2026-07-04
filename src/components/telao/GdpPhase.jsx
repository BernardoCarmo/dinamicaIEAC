import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

// Não mostra nenhum valor numérico de PIB/saldo aqui — só a confirmação de
// que o PIB da rodada foi creditado a todos os países.
export default function GdpPhase({ roundLabel }) {
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div className="section-title">{roundLabel} — PIB creditado</div>
      <div className="grid-countries">
        {COUNTRIES.map((c, i) => (
          <motion.div
            key={c.id}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span className="flag">{c.flag}</span>
              <strong>{c.name}</strong>
            </div>
            <div style={{ fontSize: "1.6rem", marginTop: 8 }}>💰</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
