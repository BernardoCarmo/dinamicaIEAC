import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

export default function EventPhase({ event, roundLabel }) {
  if (!event) return null;

  let affectedLine = null;
  if (event.type === "tag") {
    const affected = COUNTRIES.filter((c) => c.themeTags.includes(event.tag));
    affectedLine =
      affected.length > 0
        ? `Países afetados: ${affected.map((c) => `${c.flag} ${c.name}`).join(", ")}`
        : "Nenhum país tem essa característica nesta partida — o efeito de PIB não se aplica a ninguém.";
  } else if (event.type === "random1") {
    const target = COUNTRIES.find((c) => c.id === event.randomTargetCountryId);
    affectedLine = `País sorteado: ${target?.flag} ${target?.name}`;
  } else if (event.type === "all") {
    affectedLine = "Afeta todos os 6 países.";
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Evento sorteado</div>
      <motion.div
        key={event.id}
        className="card"
        style={{ maxWidth: 720, margin: "0 auto" }}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 style={{ fontSize: "2.6rem" }}>{event.name}</h1>
        <p style={{ fontSize: "1.4rem" }}>{event.description}</p>
        {affectedLine && (
          <motion.p
            style={{ fontSize: "1.1rem", color: "var(--accent)", fontWeight: 700 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {affectedLine}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
