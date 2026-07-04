import { motion } from "framer-motion";

export default function EventPhase({ event, roundLabel }) {
  if (!event) return null;
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
      </motion.div>
    </div>
  );
}
