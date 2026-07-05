import { useEffect, useRef } from "react";
import { setMasterVolume } from "../audio/synthEngine";
import { CUES } from "../audio/cues";

// Toca o cue correspondente à fase atual do jogo, trocando automaticamente
// quando "cueKey" muda (sem reiniciar o mesmo loop à toa a cada render).
export function useGameAudio(cueKey, { muted = false, volume = 0.6 } = {}) {
  const stopRef = useRef(null);
  const lastCueRef = useRef(null);

  useEffect(() => {
    setMasterVolume(muted ? 0 : volume);
  }, [muted, volume]);

  useEffect(() => {
    if (cueKey === lastCueRef.current) return;
    lastCueRef.current = cueKey;

    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }

    const cue = CUES[cueKey];
    if (!cue) return;

    if (cue.type === "loop") {
      stopRef.current = cue.play();
    } else {
      cue.play();
    }
  }, [cueKey]);

  useEffect(
    () => () => {
      if (stopRef.current) stopRef.current();
    },
    []
  );
}
