import { motion } from "framer-motion";
import { COUNTRIES, PRIZES } from "../../config/gameConfig";

export default function ClosingScreen({ session }) {
  const champion = COUNTRIES.find((c) => c.id === session.champion);
  const wealthChampion = COUNTRIES.find((c) => c.id === session.wealthChampion);
  const ranking = session.finalRanking || [];

  return (
    <div style={{ width: "100%", maxWidth: 800, display: "flex", flexDirection: "column", gap: 30 }}>
      <motion.div
        className="card"
        style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="section-title">Placar 1 — Campeão da Final</div>
        {champion ? (
          <>
            <div style={{ fontSize: "6rem" }}>{champion.flag}</div>
            <h1>{champion.name}</h1>
            <p style={{ fontSize: "1.2rem" }}>Prêmio: {PRIZES.final}</p>
          </>
        ) : (
          <p>Nenhum vencedor na final.</p>
        )}
      </motion.div>

      <motion.div
        className="card"
        style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="section-title">Placar 2 — Campeão de Riqueza Real</div>
        {wealthChampion && (
          <>
            <div style={{ fontSize: "6rem" }}>{wealthChampion.flag}</div>
            <h1>{wealthChampion.name}</h1>
            <p style={{ fontSize: "1.2rem" }}>Prêmio: {PRIZES.wealth}</p>
          </>
        )}
        <ol style={{ textAlign: "left", maxWidth: 320, margin: "20px auto 0" }}>
          {ranking.map((id) => {
            const c = COUNTRIES.find((x) => x.id === id);
            return (
              <li key={id} style={{ marginBottom: 6 }}>
                {c.flag} {c.name} — {session.countries[id].balance.toLocaleString("pt-BR")}
              </li>
            );
          })}
        </ol>
      </motion.div>
    </div>
  );
}
