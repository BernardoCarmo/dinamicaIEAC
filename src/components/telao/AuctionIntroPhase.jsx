import { motion } from "framer-motion";
import { COUNTRIES, SABOTAGE_COST_PERCENT, SABOTAGE_GDP_CUT_PERCENT, STEAL_GDP_PERCENT, STEAL_ATTACKER_PENALTY } from "../../config/gameConfig";

const ATTACK_CARD_TYPES = ["sabotage_gdp", "steal_gdp"];

export default function AuctionIntroPhase({ round, countries, roundKey, roundLabel, previousRoundSummary }) {
  const sabotage = round?.sabotage;
  const theft = round?.theft;

  const attackLines = [];
  if (sabotage) {
    const attacker = COUNTRIES.find((c) => c.id === sabotage.attackerId);
    const target = COUNTRIES.find((c) => c.id === sabotage.targetId);
    attackLines.push(
      `${attacker?.flag} ${attacker?.name} pagou ${Math.round(SABOTAGE_COST_PERCENT * 100)}% do próprio saldo ` +
        `para cortar ${Math.round(SABOTAGE_GDP_CUT_PERCENT * 100)}% do saldo de ${target?.flag} ${target?.name} nesta rodada.`
    );
  }
  if (theft) {
    const attacker = COUNTRIES.find((c) => c.id === theft.attackerId);
    const target = COUNTRIES.find((c) => c.id === theft.targetId);
    attackLines.push(
      `${attacker?.flag} ${attacker?.name} roubou ${Math.round(STEAL_GDP_PERCENT * 100)}% do saldo de ` +
        `${target?.flag} ${target?.name}, mas perdeu ${STEAL_ATTACKER_PENALTY} moedas do próprio tesouro.`
    );
  }

  const actionLines = [];
  for (const c of COUNTRIES) {
    for (const card of c.cards) {
      if (ATTACK_CARD_TYPES.includes(card.effectType)) continue;
      if (countries?.[c.id]?.cardsUsedInRound?.[card.id] === roundKey) {
        actionLines.push(`${c.flag} ${c.name} usou ${card.name}: ${card.narrative} (${card.effectText})`);
      }
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <div className="section-title" style={{ textAlign: "center" }}>
        {roundLabel} — antes do leilão começar
      </div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 16, borderColor: attackLines.length ? "var(--negative)" : undefined }}
      >
        <h3>⚠️ Nos bastidores</h3>
        {attackLines.length > 0 ? (
          attackLines.map((line, i) => (
            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.4 }}>
              {line}
            </motion.p>
          ))
        ) : (
          <p>Nenhum ataque aconteceu nesta rodada.</p>
        )}
      </motion.div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>📋 Outras movimentações da rodada</h3>
        {actionLines.length > 0 ? (
          actionLines.map((line, i) => (
            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.4 }}>
              {line}
            </motion.p>
          ))
        ) : (
          <p>Nenhuma carta de bônus foi usada nesta rodada.</p>
        )}
        {previousRoundSummary && (
          <p style={{ marginTop: 10, color: "var(--text-dim)" }}>
            Na {previousRoundSummary.roundLabel}, {previousRoundSummary.winnerName} venceu o leilão pagando{" "}
            {previousRoundSummary.amountPaid.toLocaleString("pt-BR")} e levou {previousRoundSummary.prizeText}.
          </p>
        )}
      </motion.div>
    </div>
  );
}
