import { useState } from "react";
import { usePulseStore } from "../stores/pulse-store";
import { T } from "../styles/tokens";
import { GAMES } from "../data/games";
import type { GameTag, GameID } from "../types";

export function SettingsView() {
  const userGames = usePulseStore((s) => s.userGames);
  const userGameIds = usePulseStore((s) => s.userGameIds);
  const setUserConfig = usePulseStore((s) => s.setUserConfig);
  const setView = usePulseStore((s) => s.setView);

  const [selectedGames, setSelectedGames] = useState<GameTag[]>(userGames);
  const [gameIds, setGameIds] = useState<Record<GameTag, Record<string, string>>>(() => {
    const init: Record<GameTag, Record<string, string>> = {};
    for (const g of userGames) {
      const gid = userGameIds[g];
      if (gid) {
        init[g] = { [gid.platform]: gid.username };
      }
    }
    return init;
  });
  const [saved, setSaved] = useState(false);

  const toggleGame = (id: GameTag) => {
    setSaved(false);
    setSelectedGames((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const setId = (game: GameTag, platform: string, value: string) => {
    setSaved(false);
    setGameIds((prev) => ({
      ...prev,
      [game]: { ...(prev[game] ?? {}), [platform]: value },
    }));
  };

  const allIdsSet = selectedGames.every((g) => {
    const def = GAMES.find((d) => d.id === g);
    if (!def) return true;
    return def.platforms.every((p) => {
      const val = gameIds[g]?.[p.id]?.trim();
      return val && val.length > 0;
    });
  });

  const handleSave = () => {
    const newGameIds: Record<GameTag, GameID> = {};
    for (const g of selectedGames) {
      const def = GAMES.find((d) => d.id === g);
      if (!def) continue;
      const firstPlatform = def.platforms[0];
      if (!firstPlatform) continue;
      const username = gameIds[g]?.[firstPlatform.id]?.trim() ?? "";
      newGameIds[g] = { platform: firstPlatform.id, username };
    }
    setUserConfig(selectedGames, newGameIds);
    setSaved(true);
    setTimeout(() => setView("feed"), 600);
  };

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
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.5)",
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
        }}
      >
        <button
          onClick={() => setView("feed")}
          style={{
            fontFamily: T.mono,
            fontSize: 13,
            color: T.textDim,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = T.text)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = T.textDim)}
        >
          ←
        </button>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 11,
            fontWeight: 600,
            color: T.text,
            letterSpacing: "0.08em",
          }}
        >
          SETTINGS
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px" }}>
        {/* Games section */}
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            color: T.textDim,
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          GAMES
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {GAMES.map((game) => {
            const active = selectedGames.includes(game.id);
            return (
              <button
                key={game.id}
                onClick={() => toggleGame(game.id)}
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: active ? game.color : T.textDim,
                  background: active ? `${game.color}14` : T.surface,
                  border: `1px solid ${active ? `${game.color}40` : T.border}`,
                  borderRadius: T.radiusSm,
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13, opacity: active ? 1 : 0.35 }}>{game.icon}</span>
                <span style={{ fontWeight: 600, letterSpacing: "0.05em" }}>{game.short}</span>
                {active && (
                  <span style={{ marginLeft: "auto", color: game.color, fontSize: 12 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* IDs section */}
        {selectedGames.length > 0 && (
          <>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                color: T.textDim,
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              GAME IDs
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {selectedGames.map((gameId) => {
                const def = GAMES.find((d) => d.id === gameId);
                if (!def) return null;
                return (
                  <div key={gameId}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: def.color, fontSize: 12 }}>{def.icon}</span>
                      <span
                        style={{
                          fontFamily: T.mono,
                          fontSize: 10,
                          fontWeight: 600,
                          color: def.color,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {def.short}
                      </span>
                    </div>
                    {def.platforms.map((platform) => (
                      <div key={platform.id}>
                        <div
                          style={{
                            fontFamily: T.mono,
                            fontSize: 9,
                            color: T.textDim,
                            letterSpacing: "0.08em",
                            marginBottom: 4,
                          }}
                        >
                          {platform.label.toUpperCase()}
                        </div>
                        <input
                          type="text"
                          placeholder={platform.placeholder}
                          value={gameIds[gameId]?.[platform.id] ?? ""}
                          onChange={(e) => setId(gameId, platform.id, e.target.value)}
                          style={{
                            width: "100%",
                            fontFamily: T.mono,
                            fontSize: 11,
                            color: T.text,
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radiusSm,
                            padding: "7px 9px",
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = T.borderActive;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = T.border;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer / save */}
      <div
        style={{
          padding: "10px 14px 12px",
          borderTop: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <button
          disabled={selectedGames.length === 0 || !allIdsSet}
          onClick={handleSave}
          style={{
            width: "100%",
            fontFamily: T.mono,
            fontSize: 11,
            fontWeight: 600,
            color:
              saved
                ? T.accent
                : selectedGames.length === 0 || !allIdsSet
                  ? T.textDim
                  : T.bgSolid,
            background:
              saved
                ? T.accentDim
                : selectedGames.length === 0 || !allIdsSet
                  ? T.surface
                  : T.accent,
            border: `1px solid ${saved ? T.borderActive : selectedGames.length === 0 || !allIdsSet ? T.border : T.accent}`,
            borderRadius: T.radius,
            padding: "9px",
            cursor: selectedGames.length === 0 || !allIdsSet ? "default" : "pointer",
            letterSpacing: "0.08em",
            transition: "all 0.15s",
          }}
        >
          {saved ? "SAVED ✓" : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}
