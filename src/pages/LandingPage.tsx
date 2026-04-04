import { useState, useEffect, useCallback } from "react";

// Background images — one per game
import valorantBg from "../images/valoranthd.jpg";
import fortniteBg from "../images/fortnitehd.jpg";
import lolBg from "../images/lolhd.jpg";
import cs2Bg from "../images/cs2hd.jpg";
import apexBg from "../images/apexhd.jpg";
import overwatchBg from "../images/overwatchhd.jpg";
import rocketBg from "../images/rocketlhd.jpg";
import marvelBg from "../images/marvelrhd.jpg";

const DOWNLOAD_URL =
  "https://github.com/pulse-lfg/pulse-lfg/releases/latest/download/Pulse-LFG_x64-setup.exe";

const MONO = "'JetBrains Mono', monospace";
const DISPLAY = "Impact, 'Bebas Neue', sans-serif";

interface GameCfg {
  id: string;
  name: string;
  publisher: string;
  accent: string;
  bg: string;
  modes: string[];
  ranks: string[];
  team: string | null;       // fixed label (e.g. "5v5") — null if teamOptions is used
  teamOptions?: string[];    // selectable options (e.g. Solo/Duo/Trio/Squad)
  roles?: string[];
}

const GAMES: GameCfg[] = [
  {
    id: "valorant",
    name: "VALORANT",
    publisher: "RIOT GAMES",
    accent: "#ff4655",
    bg: valorantBg,
    modes: ["COMPETITIVE", "UNRATED", "SPIKE RUSH", "SWIFTPLAY"],
    ranks: ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "ASCENDANT", "IMMORTAL", "RADIANT"],
    team: "5v5",
  },
  {
    id: "fortnite",
    name: "FORTNITE",
    publisher: "EPIC GAMES",
    accent: "#00d4ff",
    bg: fortniteBg,
    modes: ["BATTLE ROYALE", "ZERO BUILD", "RELOAD"],
    ranks: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "ELITE", "CHAMPION", "UNREAL"],
    team: null,
    teamOptions: ["SOLO", "DÚO", "TRÍO", "ESCUADRÓN"],
  },
  {
    id: "lol",
    name: "LEAGUE OF LEGENDS",
    publisher: "RIOT GAMES",
    accent: "#c89b3c",
    bg: lolBg,
    modes: ["SOLO/DUO", "FLEX QUEUE"],
    ranks: ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"],
    team: "5v5",
    roles: ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT", "FILL"],
  },
  {
    id: "cs2",
    name: "COUNTER-STRIKE 2",
    publisher: "VALVE",
    accent: "#de9b35",
    bg: cs2Bg,
    modes: ["PREMIER", "COMPETITIVE", "WINGMAN"],
    ranks: ["GREY", "LIGHT BLUE", "BLUE", "PURPLE", "PINK", "RED", "GOLD"],
    team: "5v5",
  },
  {
    id: "apex",
    name: "APEX LEGENDS",
    publisher: "EA / RESPAWN",
    accent: "#cd3333",
    bg: apexBg,
    modes: ["RANKED TRIOS"],
    ranks: ["ROOKIE", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "APEX PREDATOR"],
    team: "TRÍO (3)",
  },
  {
    id: "overwatch",
    name: "OVERWATCH 2",
    publisher: "BLIZZARD",
    accent: "#fa9c1e",
    bg: overwatchBg,
    modes: ["ROLE QUEUE", "OPEN QUEUE"],
    ranks: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER", "CHAMPION"],
    team: "5v5",
    roles: ["TANK", "DPS", "SUPPORT"],
  },
  {
    id: "rocket",
    name: "ROCKET LEAGUE",
    publisher: "PSYONIX",
    accent: "#0078f2",
    bg: rocketBg,
    modes: ["DUEL", "DOUBLES", "STANDARD", "EXTRA MODES"],
    ranks: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "CHAMPION", "GRAND CHAMPION", "SSL"],
    team: null,
    teamOptions: ["1v1", "2v2", "3v3"],
  },
  {
    id: "marvel",
    name: "MARVEL RIVALS",
    publisher: "NETEASE GAMES",
    accent: "#e44d7b",
    bg: marvelBg,
    modes: ["CONVOY", "DOMINATION", "CONVERGENCE"],
    ranks: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "GRANDMASTER", "CELESTIAL", "ETERNITY", "ONE ABOVE ALL"],
    team: "6v6",
  },
];

type FilterState = {
  mode: string;
  rank: string | null;
  team: string | null;
  role: string | null;
};

function initFilters(): FilterState[] {
  return GAMES.map((g) => ({
    mode: g.modes[0],
    rank: null,
    team: g.teamOptions ? g.teamOptions[g.teamOptions.length - 1] : null,
    role: null,
  }));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Pill({
  label,
  active,
  accent,
  onClick,
}: {
  label: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "6px 12px",
        border: `1px solid ${active || hov ? accent : "rgba(255,255,255,0.1)"}`,
        background: active ? `${accent}22` : hov ? `${accent}0e` : "rgba(255,255,255,0.03)",
        color: active ? accent : hov ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: active ? 700 : 400,
        letterSpacing: "0.08em",
        cursor: "pointer",
        borderRadius: 2,
        transition: "all 0.15s",
        boxShadow: active ? `0 0 10px ${accent}44` : "none",
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 9,
        letterSpacing: "0.22em",
        color: "rgba(255,255,255,0.35)",
        marginBottom: 10,
        textTransform: "uppercase" as const,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true); // fade state
  const [filters, setFilters] = useState<FilterState[]>(initFilters);
  const [scrolled, setScrolled] = useState(false);

  const game = GAMES[activeIdx];
  const filter = filters[activeIdx];

  // Jump to a specific game index with fade transition
  const jumpTo = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    setVisible(false);
    setTimeout(() => {
      setActiveIdx(idx);
      setVisible(true);
    }, 220);
  }, [activeIdx]);

  const navigate = useCallback(
    (dir: 1 | -1) => jumpTo((activeIdx + dir + GAMES.length) % GAMES.length),
    [activeIdx, jumpTo],
  );

  const setFilter = useCallback(
    (key: keyof FilterState, value: string | null) => {
      setFilters((prev) =>
        prev.map((f, i) => (i === activeIdx ? { ...f, [key]: value } : f)),
      );
    },
    [activeIdx],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const panelOpacity = visible ? 1 : 0;
  const panelTransition = "opacity 0.22s ease";

  return (
    <div
      style={{
        background: "#0a0a0c",
        minHeight: "100vh",
        color: "#f9f5f8",
        overflowX: "hidden",
        fontFamily: MONO,
      }}
    >
      {/* ── CSS keyframes injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 8px #00ff88} 50%{opacity:0.6;box-shadow:0 0 3px #00ff88} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:2px}
      `}</style>

      {/* ════════════════════════════════════════════════════════════════
          HERO — fullscreen game carousel
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 600,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Background layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <img
            key={game.id}
            src={game.bg}
            alt={game.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
          {/* Dark gradient overlay: stronger on right so filter panel is readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(10,10,12,0.7) 0%, rgba(10,10,12,0.55) 50%, rgba(10,10,12,0.82) 60%, rgba(10,10,12,0.92) 100%)",
            }}
          />
          {/* Subtle dot-grid texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle, ${game.accent}18 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ── Header / Nav bar ── */}
        <header
          style={{
            position: "relative",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            height: 62,
            background: scrolled ? "rgba(10,10,12,0.82)" : "rgba(10,10,12,0.45)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
            transition: "background 0.3s",
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00ff88",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: DISPLAY,
                fontSize: 20,
                letterSpacing: "0.14em",
                color: "#f9f5f8",
                userSelect: "none",
              }}
            >
              PULSE LFG
            </span>
          </div>

          {/* Center: game name + carousel dots */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              opacity: panelOpacity,
              transition: panelTransition,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
              }}
            >
              {game.name}
            </span>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {GAMES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpTo(i)}
                  style={{
                    width: i === activeIdx ? 22 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === activeIdx ? game.accent : "rgba(255,255,255,0.2)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s",
                    boxShadow: i === activeIdx ? `0 0 8px ${game.accent}99` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right CTAs */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href={DOWNLOAD_URL}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: "rgba(255,255,255,0.55)",
                textDecoration: "none",
                letterSpacing: "0.08em",
                padding: "7px 14px",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 2,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#f9f5f8";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              ⬇ WINDOWS
            </a>
            <button
              onClick={onLaunch}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                color: "#000",
                background: game.accent,
                border: "none",
                borderRadius: 2,
                padding: "7px 16px",
                cursor: "pointer",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "all 0.2s",
                boxShadow: `0 0 18px ${game.accent}55`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 28px ${game.accent}88`;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 18px ${game.accent}55`;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              LAUNCH APP
            </button>
          </div>
        </header>

        {/* ── Content row: left carousel + right filter panel ── */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* LEFT: game title area (60%) */}
          <section
            style={{
              flex: "0 0 60%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "40px 80px 52px",
              opacity: panelOpacity,
              transform: visible ? "translateX(0)" : "translateX(-16px)",
              transition: "opacity 0.22s ease, transform 0.22s ease",
            }}
          >
            {/* Left nav arrow */}
            <NavArrow dir="left" accent={game.accent} onClick={() => navigate(-1)} />

            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.5em",
                color: game.accent,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              CURRENTLY VIEWING
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontSize: "clamp(44px, 7vw, 96px)",
                lineHeight: 0.92,
                letterSpacing: "0.03em",
                color: "#f9f5f8",
                textShadow: `0 0 60px ${game.accent}55`,
                textTransform: "uppercase",
                maxWidth: "90%",
              }}
            >
              {game.name}
            </h1>

            <div
              style={{
                marginTop: 18,
                fontFamily: MONO,
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.2em",
              }}
            >
              {game.publisher}
            </div>

            {/* Status pills */}
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "rgba(10,10,12,0.65)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ color: "#00ff88", fontSize: 7, lineHeight: 1 }}>●</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em" }}>
                  EN LÍNEA
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "rgba(10,10,12,0.65)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em" }}>
                  LFG ACTIVO
                </span>
              </div>
            </div>

            {/* Right nav arrow (right edge of this section) */}
            <NavArrow dir="right" accent={game.accent} onClick={() => navigate(1)} />
          </section>

          {/* RIGHT: filter panel (40%) */}
          <aside
            style={{
              flex: "0 0 40%",
              background: "rgba(10,10,12,0.72)",
              backdropFilter: "blur(40px)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              padding: "28px 32px",
              overflowY: "auto",
              opacity: panelOpacity,
              transition: panelTransition,
            }}
          >
            {/* Game label */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
                CONFIGURAR BÚSQUEDA
              </div>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 32,
                  letterSpacing: "0.06em",
                  color: game.accent,
                  textShadow: `0 0 20px ${game.accent}66`,
                  lineHeight: 1,
                }}
              >
                {game.name}
              </div>
            </div>

            {/* MODO */}
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>MODO</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {game.modes.map((m) => (
                  <Pill
                    key={m}
                    label={m}
                    active={filter.mode === m}
                    accent={game.accent}
                    onClick={() => setFilter("mode", m)}
                  />
                ))}
              </div>
            </div>

            {/* RANGO */}
            <div style={{ marginBottom: 24, flex: 1 }}>
              <SectionLabel>RANGO</SectionLabel>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 5,
                  maxHeight: 190,
                  overflowY: "auto",
                  paddingRight: 2,
                }}
              >
                {game.ranks.map((r) => {
                  const active = filter.rank === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setFilter("rank", active ? null : r)}
                      style={{
                        padding: "8px 4px",
                        border: `1px solid ${active ? game.accent : "rgba(255,255,255,0.09)"}`,
                        background: active ? `${game.accent}20` : "rgba(255,255,255,0.03)",
                        color: active ? game.accent : "rgba(255,255,255,0.45)",
                        fontFamily: MONO,
                        fontSize: 9,
                        cursor: "pointer",
                        borderRadius: 2,
                        transition: "all 0.15s",
                        textAlign: "center" as const,
                        letterSpacing: "0.04em",
                        boxShadow: active ? `0 0 8px ${game.accent}44` : "none",
                        textTransform: "uppercase" as const,
                        lineHeight: 1.3,
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* POSICIÓN / ROL (LoL, OW2) */}
            {game.roles && (
              <div style={{ marginBottom: 24 }}>
                <SectionLabel>{game.id === "lol" ? "POSICIÓN" : "ROL"}</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {game.roles.map((r) => (
                    <Pill
                      key={r}
                      label={r}
                      active={filter.role === r}
                      accent={game.accent}
                      onClick={() => setFilter("role", filter.role === r ? null : r)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* EQUIPO */}
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>EQUIPO</SectionLabel>
              {game.teamOptions ? (
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {game.teamOptions.map((t) => (
                    <Pill
                      key={t}
                      label={t}
                      active={filter.team === t}
                      accent={game.accent}
                      onClick={() => setFilter("team", t)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 22px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    fontFamily: MONO,
                    fontSize: 18,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {game.team}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={onLaunch}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: game.accent,
                  border: "none",
                  borderRadius: 2,
                  color: "#000",
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  boxShadow: `0 0 28px ${game.accent}44`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 44px ${game.accent}77`;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 28px ${game.accent}44`;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                BUSCAR LOBBY
              </button>
              <button
                onClick={onLaunch}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  border: `1px solid ${game.accent}`,
                  borderRadius: 2,
                  color: game.accent,
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${game.accent}14`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                CREAR LOBBY
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "72px 32px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.2em",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          POR QUÉ PULSE
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { icon: "⚡", title: "WEBSOCKET EN TIEMPO REAL", desc: "Las cartas aparecen y desaparecen al instante. Sin polling, sin refresh de página." },
            { icon: "🔒", title: "CERO CUENTAS", desc: "Nada se almacena. Sin email, sin contraseña, sin perfil. Abre la app y estás en vivo." },
            { icon: "💨", title: "TTL DE 5 MINUTOS", desc: "Cada carta expira automáticamente. El feed se mantiene fresco sin moderación." },
            { icon: "🤝", title: "HANDSHAKE DIRECTO", desc: "JOINea una carta → ambos jugadores intercambian Game IDs con un handshake privado." },
            { icon: "🎮", title: "8 JUEGOS", desc: "Valorant, Fortnite, LoL, CS2, Apex, OW2, Rocket League, Marvel Rivals — con filtros de rango." },
            { icon: "🖥️", title: "APP NATIVA", desc: "Instala la app de escritorio Tauri (Windows) o úsalo directo desde el navegador." },
          ].map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          DOWNLOAD CTA
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "72px 32px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          textAlign: "center",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,136,0.04), transparent)",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.2em",
            marginBottom: 18,
          }}
        >
          EMPIEZA AHORA
        </div>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: DISPLAY,
            fontSize: "clamp(28px, 4vw, 48px)",
            color: "#f9f5f8",
            letterSpacing: "0.04em",
          }}
        >
          ¿LISTO PARA ENCONTRAR TU SQUAD?
        </h2>
        <p
          style={{
            margin: "0 auto 36px",
            maxWidth: 440,
            fontFamily: MONO,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.7,
          }}
        >
          Sin instalación — lanza desde el navegador ahora mismo. O descarga la app nativa para Windows.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onLaunch}
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              background: "#00ff88",
              border: "none",
              borderRadius: 2,
              padding: "15px 36px",
              cursor: "pointer",
              letterSpacing: "0.1em",
              boxShadow: "0 0 32px rgba(0,255,136,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 50px rgba(0,255,136,0.6)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 32px rgba(0,255,136,0.4)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            ▶ ABRIR EN NAVEGADOR — GRATIS
          </button>
          <a
            href={DOWNLOAD_URL}
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 600,
              color: "#f9f5f8",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 2,
              padding: "15px 36px",
              textDecoration: "none",
              display: "inline-block",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            ⬇ WINDOWS .EXE
          </a>
        </div>
        <p
          style={{
            marginTop: 16,
            fontFamily: MONO,
            fontSize: 9,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.06em",
          }}
        >
          Windows 10+ · WebView2 requerido (pre-instalado en Win11) · ~8MB
        </p>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "22px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 16,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          PULSE LFG
        </span>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.08em",
            display: "flex",
            gap: 20,
          }}
        >
          <span>RUST + REACT</span>
          <span>TAURI DESKTOP</span>
          <span>OPEN SOURCE</span>
        </div>
        <button
          onClick={onLaunch}
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: "#00ff88",
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.1em",
            padding: 0,
          }}
        >
          LAUNCH APP →
        </button>
      </footer>
    </div>
  );
}

// ─── Nav arrow button ─────────────────────────────────────────────────────────

function NavArrow({
  dir,
  accent,
  onClick,
}: {
  dir: "left" | "right";
  accent: string;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "absolute",
        [dir]: dir === "left" ? 16 : 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 30,
        background: hov ? `${accent}22` : "rgba(0,0,0,0.45)",
        border: `1px solid ${hov ? accent : "rgba(255,255,255,0.1)"}`,
        borderRadius: 2,
        width: 44,
        height: 44,
        cursor: "pointer",
        fontSize: 16,
        color: hov ? accent : "rgba(255,255,255,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        boxShadow: hov ? `0 0 14px ${accent}55` : "none",
        lineHeight: 1,
      }}
    >
      {dir === "left" ? "◀" : "▶"}
    </button>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "22px 24px",
        background: hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 2,
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          color: "#f9f5f8",
          letterSpacing: "0.07em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
        {desc}
      </div>
    </div>
  );
}
