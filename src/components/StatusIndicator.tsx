import { usePulseStore } from "../stores/pulse-store";
import { T } from "../styles/tokens";

export function StatusIndicator() {
  const connected = usePulseStore((s) => s.connected);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: connected ? T.accent : T.danger,
          boxShadow: connected
            ? `0 0 6px ${T.accentGlow}`
            : `0 0 6px ${T.dangerMid}`,
          animation: connected ? "pulseGlow 2s ease-in-out infinite" : "none",
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      />
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          color: connected ? T.accent : T.danger,
          letterSpacing: "0.08em",
          opacity: 0.8,
        }}
      >
        {connected ? "LIVE" : "OFF"}
      </span>
    </div>
  );
}
