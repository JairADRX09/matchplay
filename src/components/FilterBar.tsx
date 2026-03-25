import { usePulseStore } from "../stores/pulse-store";
import { T } from "../styles/tokens";
import { GAMES, getGame } from "../data/games";
import type { GameMode } from "../types";

const MODES: ("All" | GameMode)[] = ["All", "Ranked", "Casual"];

export function FilterBar() {
  const userGames = usePulseStore((s) => s.userGames);
  const selectedGames = usePulseStore((s) => s.selectedGames);
  const modeFilter = usePulseStore((s) => s.modeFilter);
  const toggleGameFilter = usePulseStore((s) => s.toggleGameFilter);
  const setModeFilter = usePulseStore((s) => s.setModeFilter);

  if (userGames.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 14px",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Game chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {userGames.map((gameId) => {
          const game = getGame(gameId) ?? GAMES[0]!;
          const active = selectedGames.includes(gameId);
          return (
            <button
              key={gameId}
              onClick={() => toggleGameFilter(gameId)}
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                fontWeight: 600,
                color: active ? game.color : T.textDim,
                background: active ? `${game.color}14` : T.surface,
                border: `1px solid ${active ? `${game.color}40` : T.border}`,
                borderRadius: T.radiusSm,
                padding: "3px 8px",
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ opacity: active ? 1 : 0.5 }}>{game.icon}</span>
              {game.short}
            </button>
          );
        })}
      </div>

      {/* Mode filter */}
      <div style={{ display: "flex", gap: 4 }}>
        {MODES.map((m) => {
          const active = modeFilter === m;
          return (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                color: active ? T.accent : T.textDim,
                background: active ? T.accentDim : "transparent",
                border: `1px solid ${active ? T.borderActive : "transparent"}`,
                borderRadius: T.radiusSm,
                padding: "2px 7px",
                letterSpacing: "0.07em",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {m.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
