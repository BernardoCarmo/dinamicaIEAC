import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";
import CountUpNumber from "../shared/CountUpNumber.jsx";

export default function InflationPhase({ round, countries, roundLabel }) {
  const before = round?.balancesBeforeInflation || {};

  return (
    <div style={{ width: "100%" }}>
      <div className="section-title" style={{ textAlign: "center" }}>
        {roundLabel} — Inflação de {round?.inflationRate}%
      </div>
      <div className="grid-countries">
        {COUNTRIES.map((c, i) => {
          const from = before[c.id] ?? 0;
          const to = countries?.[c.id]?.balance ?? 0;
          const fell = to < from;
          return (
            <motion.div
              key={c.id}
              className="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="flag">{c.flag}</span>
                <strong>{c.name}</strong>
              </div>
              <div style={{ fontSize: "1.8rem", marginTop: 8 }}>
                <CountUpNumber
                  value={to}
                  initialValue={from}
                  duration={1600}
                  className={`money ${fell ? "negative" : "positive"}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
