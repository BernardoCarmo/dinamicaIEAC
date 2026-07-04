import { COUNTRIES } from "../../config/gameConfig";

export default function BidList({ bids }) {
  const list = Object.values(bids || {}).sort((a, b) => b.amount - a.amount);

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
              borderRadius: 8,
              background: i === 0 ? "var(--accent-strong)" : "var(--bg-panel)",
              color: i === 0 ? "#1a1305" : "var(--text)",
              fontWeight: i === 0 ? 700 : 400,
            }}
          >
            <span>
              {country?.flag} {country?.name}
            </span>
            <span className="money">{b.amount.toLocaleString("pt-BR")}</span>
          </div>
        );
      })}
      {list.length === 0 && <p>Nenhum lance ainda.</p>}
    </div>
  );
}
