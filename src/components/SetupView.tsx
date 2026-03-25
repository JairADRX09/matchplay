import { useState } from "react";
import { usePulseStore } from "../stores/pulse-store";
import { T } from "../styles/tokens";
import { GAMES } from "../data/games";
import type { GameTag, GameID } from "../types";

export function SetupView() {
  const setUserConfig = usePulseStore((s) => s.setUserConfig);

  const [step, setStep] = useState(0);
  const [selectedGames, setSelectedGames] = useState<GameTag[]>([]);
  const [gameIds, setGameIds] = useState<Record<GameTag, Record<string, string>>>({});

  // Step 0: game selection
  const toggleGame = (id: GameTag) => {
    setSelectedGames((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // Step 1: ID configuration
  const setId = (game: GameTag, platform: string, value: string) => {
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

  const handleDone = () => {
    const userGameIds: Record<GameTag, GameID> = {};
    for (const g of selectedGames) {
      const def = GAMES.find((d) => d.id === g);
      if (!def) continue;
      const firstPlatform = def.platforms[0];
      if (!firstPlatform) continue;
      const username = gameIds[g]?.[firstPlatform.id]?.trim() ?? "";
      userGameIds[g] = { platform: firstPlatform.id, username };
    }
    setUserConfig(selectedGames, userGameIds);
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
        backdropFilter: "blur(12px)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
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
            marginBottom: 4,
          }}
        >
          PULSE
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textDim }}>
          {step === 0 ? "SELECT YOUR GAMES" : "CONFIGURE YOUR IDs"}
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {[0, 1].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: s === step ? T.accent : T.border,
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Step 0: Game selection */}
      {step === 0 && (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 7,
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
                    fontSize: 11,
                    color: active ? game.color : T.textDim,
                    background: active ? `${game.color}14` : T.surface,
                    border: `1px solid ${active ? `${game.color}40` : T.border}`,
                    borderRadius: T.radius,
                    padding: "10px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16, opacity: active ? 1 : 0.4 }}>{game.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, letterSpacing: "0.06em" }}>{game.short}</div>
                    <div style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>{game.label}</div>
                  </div>
                  {active && (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: game.color,
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            disabled={selectedGames.length === 0}
            onClick={() => setStep(1)}
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              fontWeight: 600,
              color: selectedGames.length > 0 ? T.bgSolid : T.textDim,
              background: selectedGames.length > 0 ? T.accent : T.surface,
              border: `1px solid ${selectedGames.length > 0 ? T.accent : T.border}`,
              borderRadius: T.radius,
              padding: "10px",
              cursor: selectedGames.length > 0 ? "pointer" : "default",
              letterSpacing: "0.08em",
              transition: "all 0.15s",
            }}
          >
            NEXT →
          </button>
        </div>
      )}

      {/* Step 1: ID configuration */}
      {step === 1 && (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {selectedGames.map((gameId) => {
            const def = GAMES.find((d) => d.id === gameId);
            if (!def) return null;
            return (
              <div key={gameId}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 7,
                  }}
                >
                  <span style={{ color: def.color, fontSize: 14 }}>{def.icon}</span>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      color: def.color,
                      letterSpacing: "0.06em",
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
                        fontSize: 12,
                        color: T.text,
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: T.radiusSm,
                        padding: "8px 10px",
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

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setStep(0)}
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.textDim,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                padding: "8px 12px",
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
            >
              ← BACK
            </button>
            <button
              disabled={!allIdsSet}
              onClick={handleDone}
              style={{
                flex: 1,
                fontFamily: T.mono,
                fontSize: 11,
                fontWeight: 600,
                color: allIdsSet ? T.bgSolid : T.textDim,
                background: allIdsSet ? T.accent : T.surface,
                border: `1px solid ${allIdsSet ? T.accent : T.border}`,
                borderRadius: T.radiusSm,
                padding: "8px",
                cursor: allIdsSet ? "pointer" : "default",
                letterSpacing: "0.08em",
                transition: "all 0.15s",
              }}
            >
              GO LIVE →
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "8px 16px 12px",
          fontFamily: T.mono,
          fontSize: 9,
          color: T.textDim,
          textAlign: "center",
          opacity: 0.5,
          letterSpacing: "0.08em",
        }}
      >
        PULSE LFG · EPHEMERAL · NO ACCOUNT NEEDED
      </div>
    </div>
  );
}
