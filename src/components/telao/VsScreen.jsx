import { motion } from "framer-motion";
import { COUNTRIES } from "../../config/gameConfig";

export default function VsScreen({ finalists }) {
  const [id1, id2] = finalists || [];
  const c1 = COUNTRIES.find((c) => c.id === id1);
  const c2 = COUNTRIES.find((c) => c.id === id2);
  if (!c1 || !c2) return <p>Aguardando apuração dos finalistas...</p>;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 90 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontSize: "8rem" }}>{c1.flag}</div>
        <h2>{c1.name}</h2>
      </motion.div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        style={{ fontSize: "3rem", fontWeight: 900, color: "var(--accent)" }}
      >
        VS
      </motion.div>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 90 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontSize: "8rem" }}>{c2.flag}</div>
        <h2>{c2.name}</h2>
      </motion.div>
    </div>
  );
}
