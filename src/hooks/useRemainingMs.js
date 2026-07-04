import { useEffect, useState } from "react";

// Retorna quantos ms faltam até "endsAt" (timestamp em tempo do servidor),
// atualizando a cada 250ms. Usado tanto pelo cronômetro visual quanto para
// decidir quando os lances do leilão às cegas devem ficar visíveis.
export function useRemainingMs(endsAt, offset = 0) {
  const [remainingMs, setRemainingMs] = useState(
    endsAt == null ? 0 : Math.max(0, endsAt - (Date.now() + offset))
  );

  useEffect(() => {
    if (endsAt == null) {
      setRemainingMs(0);
      return;
    }
    function update() {
      setRemainingMs(Math.max(0, endsAt - (Date.now() + offset)));
    }
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [endsAt, offset]);

  return remainingMs;
}
