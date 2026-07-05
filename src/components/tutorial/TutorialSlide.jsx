import { motion, AnimatePresence } from "framer-motion";
import {
  COUNTRIES,
  MAX_PRELIMINARY_WINS,
  AUCTION_DURATION_SEC,
  BLIND_PHASE_END_REMAINING_SEC,
  MIN_BID_INCREMENT,
  SECOND_PLACE_INFLATION_EXTRA,
  NON_WINNER_INFLATION_EXTRA,
} from "../../config/gameConfig";

const grande = COUNTRIES.filter((c) => c.tier === "grande");
const medio = COUNTRIES.filter((c) => c.tier === "medio");
const pequeno = COUNTRIES.filter((c) => c.tier === "pequeno");

function FlagsRow() {
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
      {COUNTRIES.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{ fontSize: "3rem", textAlign: "center" }}
        >
          {c.flag}
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{c.name}</div>
        </motion.div>
      ))}
    </div>
  );
}

function Roles() {
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
      {[
        { icon: "👑", label: "Líder", desc: "controla 1 país" },
        { icon: "🎛️", label: "Mestre", desc: "comanda o jogo" },
      ].map((r, i) => (
        <motion.div
          key={r.label}
          className="card"
          style={{ minWidth: 180, textAlign: "center" }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.2 }}
        >
          <div style={{ fontSize: "2.6rem" }}>{r.icon}</div>
          <h3>{r.label}</h3>
          <p>{r.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

function TiersTable() {
  const rows = [
    { label: "Grande", list: grande, color: "var(--grande)" },
    { label: "Médio", list: medio, color: "var(--medio)" },
    { label: "Pequeno", list: pequeno, color: "var(--pequeno)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 14 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
        >
          <span className={`badge badge-${r.label.toLowerCase() === "médio" ? "medio" : r.label.toLowerCase()}`}>
            {r.label}
          </span>
          <span style={{ fontSize: "1.6rem" }}>{r.list.map((c) => c.flag).join(" ")}</span>
          <span style={{ color: "var(--text-dim)" }}>{r.list.map((c) => c.name).join(", ")}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Structure() {
  const steps = ["Rodada 1", "Rodada 2", "Rodada 3", "Final"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
      {steps.map((s, i) => (
        <motion.div
          key={s}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.2 }}
        >
          <div
            className="card"
            style={{
              padding: "14px 18px",
              background: i === 3 ? "var(--accent-strong)" : undefined,
              color: i === 3 ? "#1a1305" : undefined,
              fontWeight: 700,
            }}
          >
            {s}
          </div>
          {i < steps.length - 1 && <span style={{ fontSize: "1.5rem" }}>→</span>}
        </motion.div>
      ))}
    </div>
  );
}

function Cycle() {
  const steps = ["🎲 Evento", "🂠 Cartas", "💰 PIB", "🎭 Bastidores", "🔨 Leilão", "🏆 Resultado", "📉 Inflação", "📊 Ranking"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 640 }}>
      {steps.map((s, i) => (
        <motion.div
          key={s}
          className="card"
          style={{ padding: "10px 14px" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {i + 1}. {s}
        </motion.div>
      ))}
    </div>
  );
}

function EventDemo() {
  return (
    <motion.div
      className="card"
      style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <h3>🌾 Boom de commodities</h3>
      <p>+20% de PIB para os países exportadores de commodities.</p>
    </motion.div>
  );
}

function CardsOverview() {
  return (
    <div className="grid-countries">
      {COUNTRIES.map((c, i) => (
        <motion.div
          key={c.id}
          className="card"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flag">{c.flag}</div>
          <strong>{c.name}</strong>
          <div style={{ fontSize: "1.6rem" }}>🂠</div>
        </motion.div>
      ))}
    </div>
  );
}

function CardsDetail() {
  const items = [
    { icon: "🛡️", label: "Proteção", text: "Zera a inflação da rodada em que for usada" },
    { icon: "💵", label: "Bônus", text: "Dinheiro direto no tesouro, na hora" },
    { icon: "⚔️", label: "Ataque", text: "Mexe no PIB de outro país" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 520, margin: "0 auto" }}>
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
        >
          <span style={{ fontSize: "1.8rem" }}>{it.icon}</span>
          <div>
            <strong>{it.label}</strong>
            <div style={{ color: "var(--text-dim)" }}>{it.text}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AttackCards() {
  return (
    <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
      <motion.div className="card" style={{ textAlign: "center" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: "2.2rem" }}>🎴 ⚔️ ❓</div>
        <strong>Sabotagem de PIB</strong>
        <p>Alvo sorteado ao acaso — pode ser qualquer país</p>
      </motion.div>
      <motion.div
        className="card"
        style={{ textAlign: "center" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ fontSize: "2.2rem" }}>🎴 🕵️ ❓</div>
        <strong>Roubo de PIB</strong>
        <p>Alvo escolhido a dedo por quem ataca</p>
      </motion.div>
    </div>
  );
}

function AuctionStage1() {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
      {COUNTRIES.map((c, i) => (
        <motion.div
          key={c.id}
          className="card"
          style={{ textAlign: "center", padding: 14 }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div>{c.flag}</div>
          <div style={{ fontSize: "1.6rem" }}>✉️🔒</div>
        </motion.div>
      ))}
    </div>
  );
}

function AuctionStage2() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", fontWeight: 800 }}>00:14</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 320, margin: "10px auto" }}>
        {COUNTRIES.slice(0, 3).map((c, i) => (
          <motion.div
            key={c.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 8,
              background: i === 0 ? "var(--accent-strong)" : "var(--bg-panel)",
              color: i === 0 ? "#1a1305" : "var(--text)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.3 }}
          >
            <span>
              {c.flag} {c.name}
            </span>
            <span>{950 - i * 100}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RuleList() {
  const rules = ["➕ Incremento mínimo de 50", "🚫 Não pode passar do saldo", "⏱️ 1s de espera entre lances", "💸 Só quem vence paga"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420, margin: "0 auto" }}>
      {rules.map((r, i) => (
        <motion.div
          key={r}
          className="card"
          style={{ textAlign: "left" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
        >
          {r}
        </motion.div>
      ))}
    </div>
  );
}

function WinCap() {
  return (
    <div style={{ textAlign: "center" }}>
      <motion.div
        style={{ fontSize: "3rem", fontWeight: 800, color: "var(--accent)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        🏆🏆 {MAX_PRELIMINARY_WINS}/{MAX_PRELIMINARY_WINS}
      </motion.div>
      <motion.div
        className="badge"
        style={{ background: "var(--bg-panel)", marginTop: 10 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Classificado para a final — sem mais lances nas rodadas normais
      </motion.div>
    </div>
  );
}

function InflationBars() {
  const bars = [
    { label: "Vencedor", pct: 40, color: "var(--positive)" },
    { label: "2º lugar", pct: 100, color: "var(--negative)" },
    { label: "Demais", pct: 55, color: "var(--accent)" },
  ];
  return (
    <div style={{ display: "flex", gap: 24, justifyContent: "center", alignItems: "flex-end", height: 160 }}>
      {bars.map((b, i) => (
        <div key={b.label} style={{ textAlign: "center" }}>
          <motion.div
            style={{ width: 50, background: b.color, borderRadius: 6 }}
            initial={{ height: 0 }}
            animate={{ height: b.pct }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
          />
          <div style={{ marginTop: 6, fontSize: "0.85rem" }}>{b.label}</div>
        </div>
      ))}
    </div>
  );
}

function RankingDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320, margin: "0 auto" }}>
      {COUNTRIES.slice(0, 4).map((c, i) => (
        <motion.div
          key={c.id}
          layout
          className="card"
          style={{ display: "flex", gap: 10 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.15 }}
        >
          <strong>{i + 1}º</strong> {c.flag} {c.name}
        </motion.div>
      ))}
    </div>
  );
}

function FinalistsCascade() {
  const steps = ["Mais vitórias em leilão", "Mais dinheiro apostado no total", "Maior saldo atual", "Sorteio"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420, margin: "0 auto" }}>
      {steps.map((s, i) => (
        <motion.div
          key={s}
          className="card"
          style={{ textAlign: "left", display: "flex", gap: 10 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
        >
          <strong>{i + 1}º critério</strong> {s}
        </motion.div>
      ))}
    </div>
  );
}

function FinalRoundDemo() {
  const [a, b] = [COUNTRIES[0], COUNTRIES[5]];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ fontSize: "4rem", textAlign: "center" }}>
        {a.flag}
      </motion.div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent)" }}
      >
        VS
      </motion.div>
      <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ fontSize: "4rem", textAlign: "center" }}>
        {b.flag}
      </motion.div>
    </div>
  );
}

function PrizesEnding() {
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
      <motion.div className="card" style={{ textAlign: "center" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: "2.4rem" }}>🏆</div>
        <strong>Campeão da Final</strong>
      </motion.div>
      <motion.div
        className="card"
        style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ fontSize: "2.4rem" }}>💰</div>
        <strong>Campeão de Riqueza Real</strong>
      </motion.div>
    </div>
  );
}

function Ready() {
  return (
    <motion.div
      style={{ fontSize: "2.4rem", fontWeight: 800, textAlign: "center", color: "var(--accent)" }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
    >
      🚀 Vamos começar!
    </motion.div>
  );
}

function Summary() {
  const items = [
    { label: "Estrutura", text: "3 rodadas normais + 1 grande final, mesmo ciclo em todas." },
    { label: "Portes", text: "Grande / Médio / Pequeno — tesouro inicial e bônus de PIB diferentes." },
    {
      label: "Ciclo da rodada",
      text: "Evento → Cartas → PIB → Bastidores → Leilão → Resultado → Inflação → Ranking.",
    },
    { label: "Cartas", text: "1 uso por carta, em todo o jogo, só na pergunta do mestre antes do leilão." },
    {
      label: "Leilão",
      text: `${AUCTION_DURATION_SEC}s no total: às cegas até faltar ${BLIND_PHASE_END_REMAINING_SEC}s (quem aposta trava, quem não aposta nunca trava), depois revela e libera novos lances.`,
    },
    {
      label: "Lances",
      text: `mínimo +${MIN_BID_INCREMENT} moedas, nunca mais que o saldo, só quem vence paga.`,
    },
    { label: "Limite de vitórias", text: `no máximo ${MAX_PRELIMINARY_WINS} rodadas normais vencidas por país.` },
    {
      label: "Inflação",
      text: `vencedor do leilão: sem punição extra · 2º lugar no lance: +${SECOND_PLACE_INFLATION_EXTRA}pp · demais: +${NON_WINNER_INFLATION_EXTRA}pp.`,
    },
    { label: "Finalistas", text: "sempre automático: vitórias → total apostado → saldo → sorteio." },
    { label: "2 campeões", text: "Campeão da Final e Campeão de Riqueza Real." },
  ];
  return (
    <div className="grid-countries" style={{ textAlign: "left" }}>
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <strong style={{ color: "var(--accent)" }}>{it.label}</strong>
          <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>{it.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

const VISUALS = {
  flags: FlagsRow,
  roles: Roles,
  tiers: TiersTable,
  structure: Structure,
  cycle: Cycle,
  event: EventDemo,
  cards_overview: CardsOverview,
  cards_detail: CardsDetail,
  attack_cards: AttackCards,
  auction_stage1: AuctionStage1,
  auction_stage2: AuctionStage2,
  auction_rules: RuleList,
  win_cap: WinCap,
  inflation: InflationBars,
  ranking: RankingDemo,
  finalists: FinalistsCascade,
  final_round: FinalRoundDemo,
  prizes_ending: PrizesEnding,
  ready: Ready,
  summary: Summary,
};

export default function TutorialSlide({ slide, index, total }) {
  const Visual = VISUALS[slide.visual];
  return (
    <div style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
      <div className="section-title">
        Tutorial — slide {index + 1} de {total}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={slide.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <h1 style={{ marginBottom: 20 }}>{slide.title}</h1>
          <div style={{ marginBottom: 24 }}>{Visual && <Visual />}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560, margin: "0 auto", textAlign: "left" }}>
            {slide.bullets.map((b, i) => (
              <p key={i} style={{ margin: 0 }}>
                • {b}
              </p>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
