export default function FlagBadge({ country, size = "md" }) {
  if (!country) return null;
  const flagSize = size === "lg" ? "4rem" : size === "sm" ? "1.2rem" : "1.8rem";
  const nameSize = size === "lg" ? "1.4rem" : "1rem";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span className="flag" style={{ fontSize: flagSize }}>
        {country.flag}
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <strong style={{ fontSize: nameSize }}>{country.name}</strong>
        <span className={`badge badge-${country.tier}`}>{country.tier}</span>
      </span>
    </span>
  );
}
