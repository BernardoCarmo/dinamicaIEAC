import { motion } from "framer-motion";
import { COUNTRIES, PRIZES } from "../../config/gameConfig";

export default function ResultPhase({ round, roundKey, roundLabel }) {
  const auction = round?.auction;
  const winner = COUNTRIES.find((c) => c.id === auction?.winnerId);

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div className="section-title">{roundLabel} — Resultado do leilão</div>
      {winner ? (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
        >
          <div className="flag" style={{ fontSize: "5rem" }}>
            {winner.flag}
          </div>
          <h1>{winner.name} venceu o leilão!</h1>
          <p style={{ fontSize: "1.4rem" }}>
            Pagou <span className="money negative">{auction.amountPaid.toLocaleString("pt-BR")}</span> moedas
          </p>
          <p style={{ fontSize: "1.2rem" }}>Prêmio: {PRIZES[roundKey]}</p>
        </motion.div>
      ) : (
        <h2>Ninguém deu lance — o prêmio desta rodada não foi entregue.</h2>
      )}
    </div>
  );
}
