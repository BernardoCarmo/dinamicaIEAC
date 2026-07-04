import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";
import CountUpNumber from "../shared/CountUpNumber.jsx";

export default function GdpPhase({ round, roundLabel }) {
  const before = round?.balancesBeforeGdp || {};
  const gdp = round?.gdpAmounts || {};

  return (
    <div style={{ width: "100%" }}>
      <div className="section-title" style={{ textAlign: "center" }}>
        {roundLabel} — PIB creditado
      </div>
      <div className="grid-countries">
        {COUNTRIES.map((c, i) => (
          <motion.div
            key={c.id}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="flag">{c.flag}</span>
              <strong>{c.name}</strong>
            </div>
            <div style={{ fontSize: "1.8rem", marginTop: 8 }}>
              <CountUpNumber
                value={(before[c.id] ?? 0) + (gdp[c.id] ?? 0)}
                initialValue={before[c.id] ?? 0}
                duration={1600}
                className="money positive"
              />
            </div>
            <div style={{ color: "var(--positive)" }}>+{(gdp[c.id] ?? 0).toLocaleString("pt-BR")}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
