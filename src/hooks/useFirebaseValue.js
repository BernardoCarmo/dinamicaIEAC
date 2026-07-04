import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

// Assina um caminho do Realtime Database e retorna [valor, carregando].
// O valor é null enquanto carrega ou se o caminho não existir.
export function useFirebaseValue(path) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setValue(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const dbRef = ref(db, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setValue(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [path]);

  return [value, loading];
}
