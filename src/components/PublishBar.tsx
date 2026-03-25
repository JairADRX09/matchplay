import { useState, useEffect } from "react";
import { usePulseStore } from "../stores/pulse-store";
import { T } from "../styles/tokens";
import { GAMES, getGame } from "../data/games";
import type { GameMode, RankTier } from "../types";

export function PublishBar() {
  const userGames = usePulseStore((s) => s.userGames);
  const myCardId = usePulseStore((s) => s.myCardId);
  const pendingPublish = usePulseStore((s) => s.pendingPublish);
  const publishError = usePulseStore((s) => s.publishError);
  const publishCard = usePulseStore((s) => s.publishCard);
  const dismissCard = usePulseStore((s) => s.dismissCard);
  const clearPublishError = usePulseStore((s) => s.clearPublishError);

  const [open, setOpen] = useState(false);
  const [game, setGame] = useState(userGames[0] ?? "");
  const [mode, setMode] = useState<GameMode>("Ranked");
  const [rank, setRank] = useState<RankTier | null>(null);

  // Keep game in sync with userGames
  useEffect(() => {
    if (userGames.length > 0 && !userGames.includes(game)) {
      setGame(userGames[0]!);
      setRank(null);
    }
  }, [userGames, game]);

  // Reset rank when game changes
  const gameDef = getGame(game);
  const ranks = gameDef?.ranks ?? [];

  useEffect(() => {
    setRank(null);
  }, [game]);

  // Auto-clear error
  useEffect(() => {
    if (publishError) {
      const t = setTimeout(clearPublishError, 3_000);
      return () => clearTimeout(t);
    }
  }, [publishError, clearPublishError]);

  const isPublishing = pendingPublish !== null;
  const hasCard = myCardId !== null || isPublishing;

  if (hasCard) {
    return (
      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T.accent,
              boxShadow: `0 0 8px ${T.accentGlow}`,
              animation: "pulseGlow 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMid }}>
            {isPublishing ? "BROADCASTING…" : "SIGNAL ACTIVE"}
          </span>
        </div>
        {myCardId && (
          <button
            onClick={() => dismissCard(myCardId)}
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.danger,
              background: T.dangerDim,
              border: `1px solid ${T.dangerMid}`,
              borderRadius: T.radiusSm,
              padding: "4px 9px",
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "background 0.15s",
            }}
          >
            ✕ DISMISS
          </button>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
        {publishError && (
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.danger,
              marginBottom: 8,
              padding: "5px 8px",
              background: T.dangerDim,
              border: `1px solid ${T.dangerMid}`,
              borderRadius: T.radiusSm,
            }}
          >
            {publishError}
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          style={{
            width: "100%",
            fontFamily: T.mono,
            fontSize: 11,
            fontWeight: 600,
            color: T.accent,
            background: T.accentDim,
            border: `1px solid ${T.borderActive}`,
            borderRadius: T.radius,
            padding: "9px",
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.accentMid;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.accentDim;
          }}
        >
          📡  SEND SIGNAL
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px 14px",
        borderTop: `1px solid ${T.borderActive}`,
        background: T.accentDim,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {/* Game select */}
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          style={selectStyle}
        >
          {userGames.map((g) => {
            const def = getGame(g) ?? GAMES[0]!;
            return (
              <option key={g} value={g}>
                {def.short}
              </option>
            );
          })}
        </select>

        {/* Mode select */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as GameMode)}
          style={selectStyle}
        >
          <option value="Ranked">RANKED</option>
          <option value="Casual">CASUAL</option>
        </select>

        {/* Rank select */}
        <select
          value={rank?.ordinal ?? ""}
          onChange={(e) => {
            const r = ranks.find((r) => r.ordinal === Number(e.target.value));
            setRank(r ?? null);
          }}
          style={{ ...selectStyle, flex: 1 }}
        >
          <option value="">Select rank…</option>
          {ranks.map((r) => (
            <option key={r.ordinal} value={r.ordinal}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => setOpen(false)}
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            color: T.textDim,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            padding: "6px 10px",
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          CANCEL
        </button>
        <button
          disabled={!rank}
          onClick={() => {
            if (rank) {
              publishCard(game, mode, rank);
              setOpen(false);
            }
          }}
          style={{
            flex: 1,
            fontFamily: T.mono,
            fontSize: 11,
            fontWeight: 600,
            color: rank ? T.bgSolid : T.textDim,
            background: rank ? T.accent : T.surface,
            border: `1px solid ${rank ? T.accent : T.border}`,
            borderRadius: T.radiusSm,
            padding: "6px",
            cursor: rank ? "pointer" : "default",
            letterSpacing: "0.08em",
            transition: "all 0.15s",
          }}
        >
          BROADCAST
        </button>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  color: "rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "5px 7px",
  cursor: "pointer",
  letterSpacing: "0.06em",
  outline: "none",
};
