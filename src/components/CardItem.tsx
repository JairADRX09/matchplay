import { useState } from "react";
import type { Card, CardId } from "../types";
import { T } from "../styles/tokens";
import { elapsed, ttlPercent, ttlColor } from "../lib/utils";
import { getGame } from "../data/games";

interface Props {
  card: Card;
  isMyCard: boolean;
  now: number; // unix seconds, ticked by parent
  onJoin: (cardId: CardId) => void;
  onDismiss: (cardId: CardId) => void;
}

export function CardItem({ card, isMyCard, now, onJoin, onDismiss }: Props) {
  const [hovered, setHovered] = useState(false);

  const game = getGame(card.game);
  const gameColor = game?.color ?? T.accent;
  const pct = ttlPercent(card.created_at);
  // Override now usage: pct is computed from Date.now() inside ttlPercent,
  // but we pass `now` to keep cards in sync with a single ticker.
  const syncedPct = Math.max(0, 1 - (now - card.created_at) / 300);
  const barColor = ttlColor(syncedPct);
  const elapsedStr = elapsed(card.created_at);

  void pct; // used via syncedPct

  return (
    <div
      className="card-enter"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.surfaceHover : T.surface,
        border: `1px solid ${hovered ? T.borderActive : T.border}`,
        borderRadius: T.radius,
        padding: "10px 12px 0",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.15s, border-color 0.15s",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Game icon */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: `${gameColor}18`,
            border: `1px solid ${gameColor}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            color: gameColor,
            flexShrink: 0,
            fontFamily: T.mono,
          }}
        >
          {game?.icon ?? card.game.slice(0, 2).toUpperCase()}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}
          >
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                fontWeight: 600,
                color: gameColor,
                letterSpacing: "0.06em",
              }}
            >
              {game?.short ?? card.game}
            </span>
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                color: card.mode === "Ranked" ? T.accent : T.textMid,
                background:
                  card.mode === "Ranked" ? T.accentDim : T.surface,
                border: `1px solid ${card.mode === "Ranked" ? T.borderActive : T.border}`,
                padding: "1px 5px",
                borderRadius: 3,
                letterSpacing: "0.06em",
              }}
            >
              {card.mode.toUpperCase()}
            </span>
            {isMyCard && (
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  color: T.warn,
                  background: T.warnDim,
                  border: "1px solid rgba(255,170,46,0.3)",
                  padding: "1px 5px",
                  borderRadius: 3,
                  letterSpacing: "0.06em",
                }}
              >
                YOU
              </span>
            )}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textMid }}>
            {card.rank.label}
            <span style={{ color: T.textDim, marginLeft: 8, fontSize: 10 }}>
              {elapsedStr}
            </span>
          </div>
        </div>

        {/* Action */}
        {isMyCard ? (
          <button
            onClick={() => onDismiss(card.id)}
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.danger,
              background: T.dangerDim,
              border: `1px solid ${T.dangerMid}`,
              borderRadius: T.radiusSm,
              padding: "5px 8px",
              letterSpacing: "0.06em",
              transition: "background 0.15s, border-color 0.15s",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕ DISMISS
          </button>
        ) : (
          <button
            onClick={() => onJoin(card.id)}
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              fontWeight: 600,
              color: T.accent,
              background: hovered ? T.accentMid : T.accentDim,
              border: `1px solid ${hovered ? T.accentGlow : T.borderActive}`,
              borderRadius: T.radiusSm,
              padding: "5px 10px",
              letterSpacing: "0.06em",
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "background 0.15s, border-color 0.15s, transform 0.1s",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            JOIN →
          </button>
        )}
      </div>

      {/* TTL bar */}
      <div
        style={{
          height: 2,
          background: T.border,
          margin: "10px -12px 0",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${syncedPct * 100}%`,
            background: barColor,
            transition: "width 1s linear, background 0.5s",
          }}
        />
      </div>
    </div>
  );
}
