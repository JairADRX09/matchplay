import { useState, useEffect, useCallback } from "react";
import { usePulseStore } from "../stores/pulse-store";
import { GAMES, getGame } from "../data/games";
import type { Card, GameMode, GameTag } from "../types";
import { CARD_TTL_SECS, elapsedSecs } from "../lib/utils";
import { SetupView } from "./SetupView";
import { SettingsView } from "./SettingsView";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: "#270038",
  surface: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.12)",
  accent: "#00ffa3",
  accentDim: "rgba(0,255,163,0.15)",
  text: "#f0eeff",
  textMid: "rgba(240,238,255,0.52)",
  textDim: "rgba(240,238,255,0.2)",
  danger: "#ff4d6a",
  warn: "#ffaa2e",
  radius: 8,
  width: 324,
};

type Tab = "quick" | "create" | "browse";

// ── Root sidebar ──────────────────────────────────────────────────────────────
export function PulseSidebar({ isTauri = false }: { isTauri?: boolean }) {
  const view = usePulseStore((s) => s.view);
  const handshake = usePulseStore((s) => s.handshake);
  const connected = usePulseStore((s) => s.connected);
  const connectedCount = usePulseStore((s) => s.connectedCount);
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div
      style={{
        position: isTauri ? "fixed" : "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: isTauri ? "100vw" : C.width,
        background: C.bg,
        borderLeft: isTauri ? "none" : "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: C.text,
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      <SidebarHeader
        connected={connected}
        connectedCount={connectedCount}
        onSettings={() => usePulseStore.getState().setView("settings")}
      />

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {view === "setup" && (
          <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", justifyContent: "center" }}>
            <SetupView />
          </div>
        )}
        {view === "settings" && (
          <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", justifyContent: "center" }}>
            <SettingsView />
          </div>
        )}
        {view === "feed" && (
          <>
            <TabBar tab={tab} setTab={setTab} />
            <div style={{ flex: 1, overflow: "auto" }}>
              {tab === "quick" && <QuickSearchView />}
              {tab === "create" && <CreateLobbyView />}
              {tab === "browse" && <BrowseView />}
            </div>
          </>
        )}
      </div>

      {handshake && <LobbyRoomOverlay />}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function SidebarHeader({
  connected,
  connectedCount,
  onSettings,
}: {
  connected: boolean;
  connectedCount: number;
  onSettings: () => void;
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 3, color: C.accent }}>
        MACU
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Connected count pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 8px",
          background: "rgba(0,0,0,0.25)",
          borderRadius: 20,
          border: `1px solid ${C.border}`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: connected ? C.accent : C.danger,
            display: "inline-block",
            boxShadow: connected ? `0 0 5px ${C.accent}` : "none",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: connected ? C.accent : C.textDim,
            fontVariantNumeric: "tabular-nums",
            minWidth: 14,
            textAlign: "center",
          }}
        >
          {connectedCount}
        </span>
      </div>

      {/* Settings */}
      <button
        onClick={onSettings}
        style={{
          background: "none",
          border: "none",
          color: C.textMid,
          cursor: "pointer",
          fontSize: 15,
          padding: "3px 5px",
          borderRadius: C.radius,
        }}
        title="Settings"
      >
        ⚙
      </button>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "quick", label: "QUICK" },
    { key: "create", label: "CREATE" },
    { key: "browse", label: "BROWSE" },
  ];
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            flex: 1,
            padding: "10px 0",
            background: "none",
            border: "none",
            borderBottom: tab === t.key ? `2px solid ${C.accent}` : "2px solid transparent",
            color: tab === t.key ? C.accent : C.textMid,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Quick Search ──────────────────────────────────────────────────────────────
function QuickSearchView() {
  const cards = usePulseStore((s) => s.cards);
  const myCardId = usePulseStore((s) => s.myCardId);
  const userGames = usePulseStore((s) => s.userGames);
  const [selGame, setSelGame] = useState<GameTag>(userGames[0] ?? "");
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (userGames.length > 0 && !userGames.includes(selGame)) {
      setSelGame(userGames[0]);
    }
  }, [userGames, selGame]);

  const now = Math.floor(Date.now() / 1000);
  // Always filter by the selected game — updates instantly when dropdown changes
  const lobbies = cards.filter((c) => {
    if (c.id === myCardId) return false;
    if (now - c.created_at >= CARD_TTL_SECS) return false;
    if (selGame && c.game !== selGame) return false;
    return true;
  });

  if (userGames.length === 0) {
    return <div style={{ padding: 14 }}><EmptySetup /></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Game selector — filter updates instantly */}
      <div style={{ padding: "10px 10px 8px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <select
          value={selGame}
          onChange={(e) => setSelGame(e.target.value)}
          style={{ ...selectStyle, padding: "7px 8px", fontSize: 12 }}
        >
          {GAMES.filter((g) => userGames.includes(g.id)).map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
        <div style={{ marginTop: 6, fontSize: 11, color: C.textMid }}>
          Lobbies de{" "}
          <strong style={{ color: C.accent }}>{getGame(selGame)?.label ?? selGame}</strong>
        </div>
      </div>

      {/* Lobby list */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {lobbies.length === 0 ? (
          <div style={{ textAlign: "center", padding: 28, color: C.textDim }}>
            <div style={{ fontSize: 24, marginBottom: 7 }}>◌</div>
            <div style={{ fontSize: 12 }}>Sin lobbies para este juego</div>
            <div style={{ fontSize: 10, marginTop: 3 }}>Crea uno en la pestaña CREATE</div>
          </div>
        ) : (
          lobbies.map((card) => <LobbyCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

// ── Create Lobby ──────────────────────────────────────────────────────────────
function CreateLobbyView() {
  const userGames = usePulseStore((s) => s.userGames);
  const myCardId = usePulseStore((s) => s.myCardId);
  const pendingPublish = usePulseStore((s) => s.pendingPublish);
  const publishError = usePulseStore((s) => s.publishError);
  const [selGame, setSelGame] = useState<GameTag>(userGames[0] ?? "");
  const [selMode, setSelMode] = useState<GameMode>("Ranked");
  const [selRankIdx, setSelRankIdx] = useState(0);
  const [selSlots, setSelSlots] = useState(4);
  const gameDef = getGame(selGame);
  const isActive = !!pendingPublish || !!myCardId;

  useEffect(() => {
    if (userGames.length > 0 && !userGames.includes(selGame)) {
      setSelGame(userGames[0]);
    }
  }, [userGames, selGame]);

  // Clamp slots when game changes
  useEffect(() => {
    if (gameDef) {
      setSelSlots((s) => Math.min(s, gameDef.maxPlayers));
    }
  }, [gameDef]);

  if (userGames.length === 0) return <div style={{ padding: 14 }}><EmptySetup /></div>;

  const maxP = gameDef?.maxPlayers ?? 4;

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
      {publishError && <ErrorBox message={publishError} />}

      <label style={labelStyle}>JUEGO</label>
      <select
        value={selGame}
        onChange={(e) => { setSelGame(e.target.value); setSelRankIdx(0); }}
        style={selectStyle}
      >
        {GAMES.filter((g) => userGames.includes(g.id)).map((g) => (
          <option key={g.id} value={g.id}>{g.label}</option>
        ))}
      </select>

      <label style={labelStyle}>MODO</label>
      <div style={{ display: "flex", gap: 8 }}>
        {(["Casual", "Ranked"] as GameMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setSelMode(m)}
            style={{
              flex: 1,
              padding: "8px 0",
              background: selMode === m ? C.accentDim : C.surface,
              border: `1px solid ${selMode === m ? C.accent : C.border}`,
              borderRadius: C.radius,
              color: selMode === m ? C.accent : C.textMid,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {selMode === "Ranked" && gameDef && gameDef.ranks.length > 0 && (
        <>
          <label style={labelStyle}>RANGO</label>
          <select
            value={selRankIdx}
            onChange={(e) => setSelRankIdx(Number(e.target.value))}
            style={selectStyle}
          >
            {gameDef.ranks.map((r, i) => (
              <option key={r.label} value={i}>{r.label}</option>
            ))}
          </select>
        </>
      )}

      <label style={labelStyle}>INTEGRANTES</label>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: maxP - 1 }, (_, i) => i + 2).map((n) => (
          <button
            key={n}
            onClick={() => setSelSlots(n)}
            style={{
              flex: 1,
              padding: "8px 0",
              background: selSlots === n ? C.accentDim : C.surface,
              border: `1px solid ${selSlots === n ? C.accent : C.border}`,
              borderRadius: C.radius,
              color: selSlots === n ? C.accent : C.textMid,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        disabled={isActive || !selGame}
        onClick={() => {
          if (!gameDef) return;
          const rank =
            selMode === "Casual"
              ? { label: "Casual", ordinal: 0 }
              : (gameDef.ranks[selRankIdx] ?? gameDef.ranks[0]);
          usePulseStore.getState().publishCard(selGame, selMode, rank, selSlots);
        }}
        style={{
          marginTop: 2,
          padding: "11px 0",
          background: isActive ? "rgba(0,0,0,0.2)" : C.accent,
          border: `1px solid ${isActive ? C.border : C.accent}`,
          borderRadius: C.radius,
          color: isActive ? C.textMid : "#000",
          cursor: isActive ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1.5,
        }}
      >
        {isActive ? "LOBBY ACTIVO..." : "CREAR LOBBY"}
      </button>

      <p style={{ color: C.textDim, fontSize: 11, textAlign: "center", margin: 0 }}>
        {selSlots} jugadores · expira en 60s
      </p>
    </div>
  );
}

// ── Browse ────────────────────────────────────────────────────────────────────
function BrowseView() {
  const cards = usePulseStore((s) => s.cards);
  const myCardId = usePulseStore((s) => s.myCardId);
  const selectedGames = usePulseStore((s) => s.selectedGames);
  const [filterMode, setFilterMode] = useState<"All" | GameMode>("All");
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const visible = cards.filter((c) => {
    if (c.id === myCardId) return false;
    if (filterMode !== "All" && c.mode !== filterMode) return false;
    if (now - c.created_at >= CARD_TTL_SECS) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Filter bar */}
      <div
        style={{
          padding: "7px 12px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          gap: 5,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {(["All", "Casual", "Ranked"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setFilterMode(m)}
            style={{
              padding: "3px 9px",
              background: filterMode === m ? C.accentDim : "none",
              border: `1px solid ${filterMode === m ? C.accent : C.border}`,
              borderRadius: 4,
              color: filterMode === m ? C.accent : C.textMid,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 10 }}>
          {visible.length} {visible.length === 1 ? "lobby" : "lobbies"}
        </span>
      </div>

      {/* Card list */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {selectedGames.length === 0 ? (
          <EmptySetup />
        ) : visible.length === 0 ? (
          <EmptyLobbies />
        ) : (
          visible.map((card) => <LobbyCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

// ── Lobby card — matches reference image layout ────────────────────────────────
function LobbyCard({ card }: { card: Card }) {
  const [, tick] = useState(0);
  const game = getGame(card.game);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = elapsedSecs(card.created_at);
  const remaining = Math.max(0, CARD_TTL_SECS - elapsed);
  const pct = remaining / CARD_TTL_SECS;
  const timerColor = pct > 0.5 ? C.accent : pct > 0.25 ? C.warn : C.danger;

  // SVG ring params
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.25)",
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        overflow: "hidden",
      }}
    >
      {/* Game icon square */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: `${game?.color ?? C.accent}22`,
          border: `1px solid ${game?.color ?? C.accent}55`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, color: game?.color ?? C.accent }}>{game?.icon ?? "?"}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: game?.color ?? C.accent, letterSpacing: 0.5 }}>
          {game?.short ?? card.game}
        </span>
      </div>

      {/* Info column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Mode + rank */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ModeTag mode={card.mode} />
          {card.mode === "Ranked" && (
            <span style={{ fontSize: 11, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {card.rank.label}
            </span>
          )}
        </div>
        {/* Slots */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <PlayerDots slots={card.slots} maxSlots={card.max_slots} />
          <span style={{ color: C.textDim, fontSize: 10 }}>
            {card.slots}/{card.max_slots}
          </span>
        </div>
      </div>

      {/* Countdown ring */}
      <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
        <svg width={38} height={38} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={19} cy={19} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
          <circle
            cx={19}
            cy={19}
            r={r}
            fill="none"
            stroke={timerColor}
            strokeWidth={2.5}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.5s" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: timerColor,
          }}
        >
          {remaining}
        </div>
      </div>

      {/* JOIN button */}
      <button
        onClick={() => usePulseStore.getState().joinCard(card.id, card.game)}
        style={{
          padding: "8px 12px",
          background: C.accent,
          border: "none",
          borderRadius: 6,
          color: "#000",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.5,
          flexShrink: 0,
        }}
      >
        JOIN
      </button>
    </div>
  );
}

// ── Lobby room overlay ────────────────────────────────────────────────────────
function LobbyRoomOverlay() {
  const handshake = usePulseStore((s) => s.handshake!);
  const myCardId = usePulseStore((s) => s.myCardId);
  const userGameIds = usePulseStore((s) => s.userGameIds);
  const [, tick] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = elapsedSecs(handshake.createdAt);
  const remaining = Math.max(0, CARD_TTL_SECS - elapsed);
  const game = getGame(handshake.game);
  const ownId = userGameIds[handshake.game];

  // Auto-close when timer expires
  useEffect(() => {
    if (remaining === 0) {
      if (handshake.kind === "host" && myCardId) {
        usePulseStore.getState().dismissCard(myCardId);
      } else {
        usePulseStore.getState().clearHandshake();
      }
    }
  }, [remaining, handshake.kind, myCardId]);

  const copyTag = useCallback((tag: string) => {
    const doFallback = () => {
      const el = document.createElement("textarea");
      el.value = tag;
      el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tag).catch(doFallback);
    } else {
      doFallback();
    }
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const dismiss = () => {
    if (handshake.kind === "host" && myCardId) {
      usePulseStore.getState().dismissCard(myCardId);
    } else {
      usePulseStore.getState().clearHandshake();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "11px 14px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: `${game?.color ?? C.accent}22`,
            border: `1px solid ${game?.color ?? C.accent}55`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: game?.color ?? C.accent }}>{game?.icon ?? "?"}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: game?.color ?? C.accent }}>
            {game?.short ?? "?"}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.accent }}>LOBBY ROOM</div>
          <div style={{ fontSize: 11, color: C.textMid }}>
            {game?.label ?? handshake.game} ·{" "}
            {handshake.kind === "host" ? "Tu lobby" : "Te uniste"}
          </div>
        </div>
        <CountdownRing remaining={remaining} total={CARD_TTL_SECS} />
      </div>

      {/* Players */}
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: C.textMid,
            marginBottom: 10,
          }}
        >
          JUGADORES ({handshake.ids.length}/4)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[...handshake.ids].reverse().map((gid, i) => {
            const tag = gid.username;
            const isCopied = copied === tag;
            const isOwn = ownId && gid.platform === ownId.platform && gid.username === ownId.username;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 11px",
                  background: isOwn ? "rgba(0,255,163,0.06)" : C.surface,
                  border: `1px solid ${isOwn ? "rgba(0,255,163,0.25)" : C.border}`,
                  borderRadius: C.radius,
                }}
              >
                <span style={{ color: isOwn ? C.accent : C.textMid, fontSize: 10 }}>●</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: isOwn ? C.accent : C.text }}>
                    {tag} {isOwn && <span style={{ fontSize: 9, opacity: 0.6 }}>(tú)</span>}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMid }}>{gid.platform}</div>
                </div>
                {!isOwn && (
                  <button
                    onClick={() => copyTag(tag)}
                    style={{
                      padding: "3px 9px",
                      background: isCopied ? C.accentDim : "none",
                      border: `1px solid ${isCopied ? C.accent : C.border}`,
                      borderRadius: 4,
                      color: isCopied ? C.accent : C.textMid,
                      cursor: "pointer",
                      fontSize: 10,
                    }}
                  >
                    {isCopied ? "✓" : "COPY"}
                  </button>
                )}
              </div>
            );
          })}

          {handshake.ids.length === 0 && (
            <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "12px 0" }}>
              Esperando jugadores...
            </div>
          )}
        </div>

        {handshake.kind === "host" && handshake.ids.length < 4 && (
          <div
            style={{
              marginTop: 7,
              padding: "9px 11px",
              border: `1px dashed ${C.border}`,
              borderRadius: C.radius,
              color: C.textDim,
              fontSize: 11,
              textAlign: "center",
            }}
          >
            + {4 - handshake.ids.length} slots libres
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={dismiss}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "rgba(255,77,106,0.12)",
            border: `1px solid ${C.danger}`,
            borderRadius: C.radius,
            color: C.danger,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 1.5,
          }}
        >
          CERRAR LOBBY
        </button>
      </div>
    </div>
  );
}

// ── CountdownRing ─────────────────────────────────────────────────────────────
function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const pct = remaining / total;
  const color = pct > 0.5 ? C.accent : pct > 0.25 ? C.warn : C.danger;
  const dash = circ * pct;
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.5s" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color,
        }}
      >
        {remaining}
      </div>
    </div>
  );
}

// ── PlayerDots ────────────────────────────────────────────────────────────────
function PlayerDots({ slots, maxSlots }: { slots: number; maxSlots: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: maxSlots }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: i < slots ? C.accent : "rgba(255,255,255,0.12)",
            display: "inline-block",
            boxShadow: i < slots ? `0 0 4px ${C.accent}` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── ModeTag ───────────────────────────────────────────────────────────────────
function ModeTag({ mode }: { mode: GameMode }) {
  return (
    <span
      style={{
        padding: "2px 6px",
        borderRadius: 3,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.8,
        background: mode === "Ranked" ? "rgba(200,155,60,0.18)" : "rgba(0,255,163,0.12)",
        color: mode === "Ranked" ? C.warn : C.accent,
        border: `1px solid ${mode === "Ranked" ? "rgba(200,155,60,0.3)" : "rgba(0,255,163,0.2)"}`,
      }}
    >
      {mode.toUpperCase()}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(255,77,106,0.1)",
        border: `1px solid ${C.danger}`,
        borderRadius: C.radius,
        padding: "7px 11px",
        color: C.danger,
        fontSize: 12,
        marginBottom: 4,
      }}
    >
      {message}
    </div>
  );
}

function EmptySetup() {
  return (
    <div style={{ textAlign: "center", padding: "20px 0", color: C.textDim }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>⚙</div>
      <div style={{ fontSize: 12, color: C.textMid }}>Sin juegos configurados</div>
      <div style={{ fontSize: 11, marginTop: 4 }}>
        Ve a{" "}
        <button
          onClick={() => usePulseStore.getState().setView("setup")}
          style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 11, padding: 0 }}
        >
          Setup
        </button>
      </div>
    </div>
  );
}

function EmptyLobbies() {
  return (
    <div style={{ textAlign: "center", padding: 28, color: C.textDim }}>
      <div style={{ fontSize: 24, marginBottom: 7 }}>◌</div>
      <div style={{ fontSize: 12 }}>Sin lobbies activos</div>
      <div style={{ fontSize: 10, marginTop: 3 }}>Crea uno para empezar</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: C.textMid,
  marginBottom: -5,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${C.border}`,
  borderRadius: C.radius,
  color: C.text,
  fontSize: 13,
  cursor: "pointer",
};
