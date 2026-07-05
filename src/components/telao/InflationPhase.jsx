import { motion } from "framer-motion";
import { COUNTRIES, SECOND_PLACE_INFLATION_EXTRA, NON_WINNER_INFLATION_EXTRA } from "../../config/gameConfig";

// Não mostra nenhum valor numérico de saldo aqui — só a taxa de inflação de
// cada país (pública, ligada ao resultado do leilão) e um resumo narrativo,
// sem revelar dinheiro/PIB de ninguém.
export default function InflationPhase({ round, countries, roundLabel }) {
  const winnerId = round?.auction?.winnerId ?? null;
  const secondPlaceId = round?.inflationSecondPlaceId ?? null;
  const winner = COUNTRIES.find((c) => c.id === winnerId);

  function lineFor(c) {
    const usedZeroInflation = c.cards.some(
      (card) => card.effectType === "zero_inflation" && countries?.[c.id]?.cardsUsedInRound?.[card.id]
    );
    if (usedZeroInflation) {
      return `${c.flag} ${c.name} protegeu sua moeda e ficou imune à inflação nesta rodada.`;
    }
    if (c.id === winnerId) {
      return `${c.flag} ${c.name} venceu o leilão — inflação normal da rodada, sem punição extra.`;
    }
    if (c.id === secondPlaceId) {
      return `${c.flag} ${c.name} arriscou muito mas não atingiu seu objetivo: +${SECOND_PLACE_INFLATION_EXTRA} pontos percentuais de inflação.`;
    }
    return `${c.flag} ${c.name} não venceu o leilão: +${NON_WINNER_INFLATION_EXTRA} ponto percentual de inflação.`;
  }

  return (
    <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
      <div className="section-title">
        {roundLabel} — Inflação de {round?.inflationRate}% {winner ? `(base, quem venceu: ${winner.name})` : ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {COUNTRIES.map((c, i) => (
          <motion.div
            key={c.id}
            className="card"
            style={{ textAlign: "left" }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            {lineFor(c)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
