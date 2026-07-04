import { useEffect, useRef, useState } from "react";

// Cronômetro regressivo sincronizado: "endsAt" é um timestamp em "tempo do
// servidor"; cada cliente ajusta com o próprio "offset" (useServerTimeOffset)
// para que todos vejam a mesma contagem, mesmo com relógios locais diferentes.
export default function Countdown({ endsAt, offset = 0, onComplete, big = false }) {
  const [remainingMs, setRemainingMs] = useState(
    endsAt == null ? 0 : Math.max(0, endsAt - (Date.now() + offset))
  );
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    function update() {
      if (endsAt == null) return;
      const r = Math.max(0, endsAt - (Date.now() + offset));
      setRemainingMs(r);
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true;
        onComplete && onComplete();
      }
    }
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, offset]);

  if (endsAt == null) return null;
  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (totalSec % 60).toString().padStart(2, "0");
  const urgent = totalSec <= 20;

  return (
    <div
      style={{
        fontSize: big ? "4.5rem" : "1.6rem",
        fontWeight: 800,
        fontVariantNumeric: "tabular-nums",
        color: urgent ? "var(--negative)" : "var(--text)",
      }}
    >
      {mm}:{ss}
    </div>
  );
}
