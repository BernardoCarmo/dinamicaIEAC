import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

// Retorna a diferença (ms) entre o relógio do servidor Firebase e o relógio
// local, para que cronômetros fiquem sincronizados entre todos os aparelhos.
// Uso: const serverNow = Date.now() + offset;
export function useServerTimeOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const offsetRef = ref(db, ".info/serverTimeOffset");
    const unsubscribe = onValue(offsetRef, (snapshot) => {
      setOffset(snapshot.val() || 0);
    });
    return () => unsubscribe();
  }, []);

  return offset;
}
