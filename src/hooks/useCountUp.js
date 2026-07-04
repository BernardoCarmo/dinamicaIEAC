import { useEffect, useRef, useState } from "react";

// Anima um número subindo (ou descendo) suavemente até "target" sempre que
// "target" mudar. Usado para o efeito de "contagem crescente" do PIB e para
// os saldos "rolando" na fase de inflação.
export function useCountUp(target, duration = 1200, options = {}) {
  const { initialValue } = options;
  const [display, setDisplay] = useState(initialValue ?? target ?? 0);
  const fromRef = useRef(initialValue ?? target ?? 0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target == null) return;
    const from = fromRef.current;
    const to = target;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return Math.round(display);
}
