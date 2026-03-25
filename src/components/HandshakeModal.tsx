import { usePulseStore } from "../stores/pulse-store";
import { useClipboard } from "../hooks/useClipboard";
import { T } from "../styles/tokens";
import { getGame } from "../data/games";

export function HandshakeModal() {
  const handshake = usePulseStore((s) => s.handshake);
  const clearHandshake = usePulseStore((s) => s.clearHandshake);
  const { copy, copied } = useClipboard();

  if (!handshake) return null;

  const game = getGame(handshake.game);
  const gameColor = game?.color ?? T.accent;
  const isHost = handshake.kind === "host";

  return (
    <div
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) clearHandshake();
      }}
    >
      <div
        style={{
          width: 360,
          background: "rgba(14,14,22,0.98)",
          border: `1px solid ${T.borderActive}`,
          borderRadius: T.radius + 2,
          overflow: "hidden",
          boxShadow: `0 0 40px rgba(0,255,163,0.08), 0 24px 48px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {game && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `${gameColor}18`,
                border: `1px solid ${gameColor}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                color: gameColor,
                flexShrink: 0,
              }}
            >
              {game.icon}
            </div>
          )}
          <div>
            <div
              style={{
                fontFamily: T.sans,
                fontSize: 14,
                fontWeight: 600,
                color: T.text,
                marginBottom: 2,
              }}
            >
              {isHost ? "Someone joined your signal" : "Signal accepted!"}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textDim }}>
              {game?.label ?? handshake.game} ·{" "}
              {isHost ? "Copy their ID → invite in-game" : "Copy host ID → accept invite"}
            </div>
          </div>
          <button
            onClick={clearHandshake}
            style={{
              marginLeft: "auto",
              fontFamily: T.mono,
              fontSize: 14,
              color: T.textDim,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* IDs */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {handshake.ids.map((gid, i) => {
            const text = `${gid.platform}:${gid.username}`;
            const isCopied = copied === text;
            return (
              <button
                key={i}
                onClick={() => copy(text)}
                style={{
                  width: "100%",
                  fontFamily: T.mono,
                  fontSize: 12,
                  color: isCopied ? T.accent : T.text,
                  background: isCopied ? T.accentDim : T.surface,
                  border: `1px solid ${isCopied ? T.borderActive : T.border}`,
                  borderRadius: T.radiusSm,
                  padding: "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.15s",
                }}
              >
                <span>
                  <span style={{ color: T.textDim, marginRight: 8 }}>
                    [{gid.platform}]
                  </span>
                  {gid.username}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: isCopied ? T.accent : T.textDim,
                    letterSpacing: "0.06em",
                  }}
                >
                  {isCopied ? "COPIED ✓" : "COPY"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 16px 14px",
            fontFamily: T.mono,
            fontSize: 10,
            color: T.textDim,
            letterSpacing: "0.08em",
            textAlign: "center",
          }}
        >
          COPY → PASTE IN GAME → PLAY
        </div>
      </div>
    </div>
  );
}
