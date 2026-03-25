import { useState, useEffect } from "react";
import { usePulseStore } from "../stores/pulse-store";
import { T } from "../styles/tokens";
import { nowSecs } from "../lib/utils";
import { FilterBar } from "./FilterBar";
import { CardItem } from "./CardItem";
import { PublishBar } from "./PublishBar";
import { StatusIndicator } from "./StatusIndicator";

export function PulsePanel() {
  const cards = usePulseStore((s) => s.cards);
  const myCardId = usePulseStore((s) => s.myCardId);
  const selectedGames = usePulseStore((s) => s.selectedGames);
  const modeFilter = usePulseStore((s) => s.modeFilter);
  const minRankOrdinal = usePulseStore((s) => s.minRankOrdinal);
  const setView = usePulseStore((s) => s.setView);
  const joinCard = usePulseStore((s) => s.joinCard);
  const dismissCard = usePulseStore((s) => s.dismissCard);

  // Single global ticker for all TTL bars
  const [now, setNow] = useState(nowSecs);
  useEffect(() => {
    const id = setInterval(() => setNow(nowSecs()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Client-side filtering
  const visible = cards.filter((c) => {
    if (selectedGames.length > 0 && !selectedGames.includes(c.game)) return false;
    if (modeFilter !== "All" && c.mode !== modeFilter) return false;
    if (minRankOrdinal !== null && c.rank.ordinal < minRankOrdinal) return false;
    return true;
  });

  return (
    <div
      style={{
        width: T.panelWidth,
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius + 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "85vh",
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px 10px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: T.sans,
            fontSize: 16,
            fontWeight: 600,
            background: `linear-gradient(90deg, ${T.accent}, #00cfff, ${T.accent})`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradientShift 4s linear infinite",
            letterSpacing: "0.04em",
          }}
        >
          PULSE
        </span>

        <StatusIndicator />

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {visible.length > 0 && (
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.textDim,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                padding: "2px 7px",
              }}
            >
              {visible.length}
            </span>
          )}
          <button
            onClick={() => setView("settings")}
            style={{
              fontFamily: T.mono,
              fontSize: 13,
              color: T.textDim,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              lineHeight: 1,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = T.text)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = T.textDim)
            }
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar />

      {/* Card feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {visible.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "40px 0",
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.3 }}>📡</div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.textDim,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              {selectedGames.length === 0
                ? "No games selected"
                : "No signals in range"}
              <br />
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {selectedGames.length === 0
                  ? "Select games above to start"
                  : "Be the first — send a signal"}
              </span>
            </div>
          </div>
        ) : (
          visible.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isMyCard={card.id === myCardId}
              now={now}
              onJoin={(cardId) => joinCard(cardId, card.game)}
              onDismiss={dismissCard}
            />
          ))
        )}
      </div>

      {/* Publish bar */}
      <div style={{ flexShrink: 0 }}>
        <PublishBar />
      </div>
    </div>
  );
}
