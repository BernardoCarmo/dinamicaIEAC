import { COUNTRIES } from "../../config/gameConfig";

// Quando "revealed" é false (leilão às cegas fora da janela de revelação),
// mostra só quem já deu lance, em ordem de chegada, sem valores nem destaque
// pro maior — pra não vazar informação que deveria ficar oculta.
export default function BidList({ bids, revealed = true }) {
  const raw = Object.values(bids || {});
  const list = revealed ? [...raw].sort((a, b) => b.amount - a.amount) : [...raw].sort((a, b) => a.ts - b.ts);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {list.map((b, i) => {
        const country = COUNTRIES.find((c) => c.id === b.countryId);
        return (
          <div
            key={`${b.countryId}-${b.ts}-${i}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 3,
              background: revealed && i === 0 ? "var(--accent-strong)" : "var(--bg-panel)",
              color: revealed && i === 0 ? "#2b2410" : "var(--text)",
              fontWeight: revealed && i === 0 ? 700 : 400,
            }}
          >
            <span>
              {country?.flag} {country?.name}
            </span>
            <span className="money">{revealed ? b.amount.toLocaleString("pt-BR") : "🔒"}</span>
          </div>
        );
      })}
      {list.length === 0 && <p>Nenhum lance ainda.</p>}
    </div>
  );
}
