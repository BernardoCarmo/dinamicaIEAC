import { useCountUp } from "../../hooks/useCountUp";

export default function CountUpNumber({ value, className = "", duration = 1200, initialValue }) {
  const display = useCountUp(value ?? 0, duration, { initialValue });
  return <span className={className}>{display.toLocaleString("pt-BR")}</span>;
}
