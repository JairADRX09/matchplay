/**
 * WebApp — full-screen web version of Pulse LFG.
 * Replaces MacuApp for non-Tauri environments.
 * The Tauri desktop app continues to use PulseSidebar unchanged.
 */
import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { usePulseStore } from "../stores/pulse-store";
import { GAMES, getGame } from "../data/games";
import { CARD_TTL_SECS, elapsedSecs } from "../lib/utils";
import type { Card, GameMode, GameTag, GameID } from "../types";

// Game background images
import valorantBg from "../images/valoranthd.jpg";
import fortniteBg from "../images/fortnitehd.jpg";
import lolBg from "../images/lolhd.jpg";
import cs2Bg from "../images/cs2hd.jpg";
import apexBg from "../images/apexhd.jpg";
import overwatchBg from "../images/overwatchhd.jpg";
import rocketBg from "../images/rocketlhd.jpg";
import marvelBg from "../images/marvelrhd.jpg";

// Game logo images
import valorantLogo from "../images/logos/valorantlogohd.jpg";
import fortniteLogo from "../images/logos/logoFortinte.jpg";
import lolLogo from "../images/logos/leagueoflegendslogohd.jpg";
import cs2Logo from "../images/logos/countersrike2logohd.jpg";
import apexLogo from "../images/logos/apexlogohd.jpg";
import overwatchLogo from "../images/logos/pverwatchlogohd.jpg";
import rocketLogo from "../images/logos/rockerleaguelogohd.jpg";
import marvelLogo from "../images/logos/logomarvelrhd.jpg";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace";
const DISPLAY = "Impact, 'Bebas Neue', sans-serif";
const BG_BASE = "#0a0a0c";

const BG_IMAGES: Record<string, string> = {
  Valorant: valorantBg,
  Fortnite: fortniteBg,
  LeagueOfLegends: lolBg,
  CS2: cs2Bg,
  ApexLegends: apexBg,
  Overwatch2: overwatchBg,
  RocketLeague: rocketBg,
  MarvelRivals: marvelBg,
};

const GAME_LOGOS: Record<string, string> = {
  Valorant: valorantLogo,
  Fortnite: fortniteLogo,
  LeagueOfLegends: lolLogo,
  CS2: cs2Logo,
  ApexLegends: apexLogo,
  Overwatch2: overwatchLogo,
  RocketLeague: rocketLogo,
  MarvelRivals: marvelLogo,
};

// Stable pokemon sprite per username (1–1010)
function pokemonId(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0x7fffffff;
  return (h % 1010) + 1;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Pill({
  label, active, accent, onClick,
}: { label: string; active: boolean; accent: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "5px 11px",
        border: `1px solid ${active || hov ? accent : "rgba(255,255,255,0.1)"}`,
        background: active ? `${accent}22` : hov ? `${accent}0c` : "rgba(255,255,255,0.03)",
        color: active ? accent : hov ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
        fontFamily: MONO, fontSize: 10, fontWeight: active ? 700 : 400,
        letterSpacing: "0.08em", cursor: "pointer", borderRadius: 2,
        transition: "all 0.15s",
        boxShadow: active ? `0 0 8px ${accent}44` : "none",
        textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

function SLabel({ children }: { children: string }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase" as const }}>
      {children}
    </div>
  );
}

function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 18; const circ = 2 * Math.PI * r;
  const pct = remaining / total;
  const color = pct > 0.5 ? "#00ffa3" : pct > 0.25 ? "#ffaa2e" : "#ff4d6a";
  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={24} cy={24} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle cx={24} cy={24} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 12, fontWeight: 700, color }}>{remaining}</div>
    </div>
  );
}

function PlayerDots({ slots, maxSlots, accent }: { slots: number; maxSlots: number; accent: string }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: maxSlots }).map((_, i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < slots ? accent : "rgba(255,255,255,0.12)", display: "inline-block", boxShadow: i < slots ? `0 0 4px ${accent}` : "none" }} />
      ))}
    </div>
  );
}

// ─── Lobby card (in the right panel list) ────────────────────────────────────

function LobbyCard({ card, accent }: { card: Card; accent: string }) {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(id); }, []);

  const elapsed = elapsedSecs(card.created_at);
  const remaining = Math.max(0, CARD_TTL_SECS - elapsed);
  const pct = remaining / CARD_TTL_SECS;
  const timerColor = pct > 0.5 ? "#00ffa3" : pct > 0.25 ? "#ffaa2e" : "#ff4d6a";
  const r = 12; const circ = 2 * Math.PI * r;

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 2, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
    }}>
      {/* Mode + rank */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{
            padding: "2px 7px", borderRadius: 2, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
            background: card.mode === "Ranked" ? "rgba(200,155,60,0.18)" : "rgba(0,255,163,0.12)",
            color: card.mode === "Ranked" ? "#ffaa2e" : "#00ffa3",
            border: `1px solid ${card.mode === "Ranked" ? "rgba(200,155,60,0.3)" : "rgba(0,255,163,0.2)"}`,
            fontFamily: MONO,
          }}>
            {card.mode.toUpperCase()}
          </span>
          {card.mode === "Ranked" && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {card.rank.label}
            </span>
          )}
        </div>
        <PlayerDots slots={card.slots} maxSlots={card.max_slots} accent={accent} />
      </div>

      {/* Timer ring */}
      <div style={{ position: "relative", width: 30, height: 30, flexShrink: 0 }}>
        <svg width={30} height={30} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={15} cy={15} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
          <circle cx={15} cy={15} r={r} fill="none" stroke={timerColor} strokeWidth={2}
            strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.5s" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: timerColor }}>
          {remaining}
        </div>
      </div>

      {/* JOIN */}
      <button
        onClick={() => usePulseStore.getState().joinCard(card.id, card.game)}
        style={{
          padding: "7px 14px", background: accent, border: "none", borderRadius: 2,
          color: "#000", cursor: "pointer", fontFamily: MONO, fontSize: 11, fontWeight: 800,
          letterSpacing: "0.1em", flexShrink: 0, transition: "all 0.15s",
          boxShadow: `0 0 12px ${accent}44`,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${accent}88`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${accent}44`; }}
      >
        JOIN
      </button>
    </div>
  );
}

// ─── Lobby Room Overlay ───────────────────────────────────────────────────────

function LobbyRoomOverlay() {
  const handshake = usePulseStore(s => s.handshake!);
  const myCardId = usePulseStore(s => s.myCardId);
  const userGameIds = usePulseStore(s => s.userGameIds);
  const [, tick] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(id); }, []);

  const elapsed = elapsedSecs(handshake.createdAt);
  const remaining = Math.max(0, CARD_TTL_SECS - elapsed);
  const gameDef = getGame(handshake.game);
  const accent = gameDef?.color ?? "#00ffa3";
  const ownId = userGameIds[handshake.game];
  const bgImg = BG_IMAGES[handshake.game];

  useEffect(() => {
    if (remaining === 0) {
      if (handshake.kind === "host" && myCardId) usePulseStore.getState().dismissCard(myCardId);
      else usePulseStore.getState().leaveCard(handshake.cardId);
    }
  }, [remaining, handshake.kind, myCardId, handshake.cardId]);

  const copyTag = useCallback((tag: string) => {
    const fallback = () => {
      const el = document.createElement("textarea");
      el.value = tag;
      el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(tag).catch(fallback); else fallback();
    setCopied(tag); setTimeout(() => setCopied(null), 1500);
  }, []);

  const dismiss = () => {
    if (handshake.kind === "host" && myCardId) usePulseStore.getState().dismissCard(myCardId);
    else usePulseStore.getState().leaveCard(handshake.cardId);
  };

  // Player cards: actual members + empty slots
  const maxSlots = 4; // fallback; real max from card not in handshake
  const totalSlots = Math.max(handshake.ids.length + 1, maxSlots);
  const allIds = [...handshake.ids].reverse(); // newest last

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Background */}
      {bgImg && <img src={bgImg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      <div style={{ position: "absolute", inset: 0, background: bgImg ? "rgba(10,10,12,0.82)" : BG_BASE }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, ${accent}18 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 16, padding: "16px 32px", background: "rgba(10,10,12,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.06em", color: accent, textShadow: `0 0 20px ${accent}77`, lineHeight: 1 }}>
            LOBBY ROOM
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4, letterSpacing: "0.12em" }}>
            {gameDef?.label ?? handshake.game} · {handshake.kind === "host" ? "ANFITRIÓN" : "UNIDO"}
          </div>
        </div>
        <CountdownRing remaining={remaining} total={CARD_TTL_SECS} />
      </div>

      {/* Player cards */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 32px", gap: 20, overflowX: "auto" }}>
        {allIds.map((gid, i) => {
          const tag = gid.username;
          const isOwn = ownId && gid.platform === ownId.platform && gid.username === ownId.username;
          const pid = pokemonId(tag);
          const isCopied = copied === tag;
          return (
            <PlayerCard key={i} tag={tag} platform={gid.platform} pokemonId={pid} accent={accent} isOwn={!!isOwn} copied={isCopied} onCopy={() => copyTag(tag)} />
          );
        })}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, totalSlots - allIds.length) }).map((_, i) => (
          <EmptySlotCard key={`empty-${i}`} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "rgba(10,10,12,0.7)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        {/* Dots + instructions */}
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {allIds.map((_, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: `0 0 6px ${accent}`, display: "inline-block" }} />)}
            {Array.from({ length: Math.max(0, totalSlots - allIds.length) }).map((_, i) => <span key={`e${i}`} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-block" }} />)}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
            {allIds.length}/{totalSlots} · Copia el tag → Pégalo en el juego → ¡A jugar!
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{ padding: "12px 28px", background: "rgba(255,77,106,0.12)", border: "1px solid #ff4d6a", borderRadius: 2, color: "#ff4d6a", cursor: "pointer", fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", transition: "all 0.15s", boxShadow: "0 0 14px rgba(255,77,106,0.2)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.22)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.12)"; }}
        >
          SALIR DEL LOBBY
        </button>
      </div>
    </div>
  );
}

function PlayerCard({ tag, platform, pokemonId: pid, accent, isOwn, copied, onCopy }: {
  tag: string; platform: string; pokemonId: number; accent: string; isOwn: boolean; copied: boolean; onCopy: () => void;
}) {
  return (
    <div style={{
      width: 200, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
      border: `2px solid ${isOwn ? accent : "rgba(255,255,255,0.2)"}`,
      background: isOwn ? `${accent}12` : "rgba(10,10,12,0.7)",
      backdropFilter: "blur(20px)", borderRadius: 4, overflow: "hidden",
      boxShadow: `0 0 24px ${isOwn ? accent : "rgba(255,255,255,0.08)"}44`,
    }}>
      {/* Decorative header strip */}
      <div style={{ width: "100%", height: 4, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      {/* Pokemon sprite area */}
      <div style={{ width: "100%", padding: "20px 0 8px", background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${accent}18, transparent)`, display: "flex", justifyContent: "center" }}>
        <img
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pid}.png`}
          alt="avatar" width={80} height={80}
          style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 8px ${accent}88)` }}
        />
      </div>
      {/* Tag */}
      <div style={{ padding: "8px 12px 4px", width: "100%", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: isOwn ? accent : "rgba(255,255,255,0.9)", letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tag} {isOwn && <span style={{ fontSize: 9, opacity: 0.6 }}>(tú)</span>}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.08em" }}>{platform}</div>
      </div>
      {/* Copy button */}
      <div style={{ padding: "8px 12px 14px", width: "100%", boxSizing: "border-box" }}>
        {!isOwn ? (
          <button
            onClick={onCopy}
            style={{
              width: "100%", padding: "7px", background: copied ? "rgba(0,255,163,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${copied ? "#00ffa3" : "rgba(255,255,255,0.12)"}`, borderRadius: 2,
              color: copied ? "#00ffa3" : "rgba(255,255,255,0.6)", cursor: "pointer",
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", transition: "all 0.15s",
            }}
          >
            {copied ? "✓ COPIADO" : "COPIAR TAG"}
          </button>
        ) : (
          <div style={{ height: 32 }} />
        )}
      </div>
      {/* Decorative footer strip */}
      <div style={{ width: "100%", height: 4, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  );
}

function EmptySlotCard() {
  return (
    <div style={{
      width: 200, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      border: `1px dashed rgba(255,255,255,0.15)`, background: "rgba(10,10,12,0.4)", backdropFilter: "blur(10px)",
      borderRadius: 4, minHeight: 280, gap: 10,
    }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 48, color: "rgba(255,255,255,0.15)", lineHeight: 1 }}>?</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>ESPERANDO...</div>
    </div>
  );
}

// ─── Create Lobby Modal ───────────────────────────────────────────────────────

function CreateLobbyModal({ gameId, accent, onClose }: { gameId: GameTag; accent: string; onClose: () => void }) {
  const gameDef = getGame(gameId);
  const myCardId = usePulseStore(s => s.myCardId);
  const pendingPublish = usePulseStore(s => s.pendingPublish);
  const publishError = usePulseStore(s => s.publishError);
  const [mode, setMode] = useState<GameMode>("Ranked");
  const [rankIdx, setRankIdx] = useState(0);
  const [slots, setSlots] = useState(gameDef?.maxPlayers ?? 4);
  const isActive = !!pendingPublish || !!myCardId;
  const maxP = gameDef?.maxPlayers ?? 4;

  const create = () => {
    if (!gameDef) return;
    const rank = mode === "Casual" ? { label: "Casual", ordinal: 0 } : (gameDef.ranks[rankIdx] ?? gameDef.ranks[0]);
    usePulseStore.getState().publishCard(gameId, mode, rank, slots);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 360, background: "#0d0d10", border: `1px solid ${accent}44`, borderRadius: 4, overflow: "hidden", boxShadow: `0 0 40px ${accent}22` }}>
        {/* Header strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.08em", color: accent, marginBottom: 4 }}>CREAR LOBBY</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", marginBottom: 20 }}>
            {gameDef?.label?.toUpperCase() ?? gameId}
          </div>

          {publishError && (
            <div style={{ background: "rgba(255,77,106,0.1)", border: "1px solid #ff4d6a", borderRadius: 2, padding: "8px 12px", color: "#ff4d6a", fontFamily: MONO, fontSize: 11, marginBottom: 16 }}>
              {publishError}
            </div>
          )}

          {/* MODO */}
          <SLabel>MODO</SLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["Casual", "Ranked"] as GameMode[]).map(m => (
              <Pill key={m} label={m} active={mode === m} accent={accent} onClick={() => setMode(m)} />
            ))}
          </div>

          {/* RANGO */}
          {mode === "Ranked" && gameDef && gameDef.ranks.length > 0 && (
            <>
              <SLabel>RANGO</SLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 20, maxHeight: 160, overflowY: "auto" }}>
                {gameDef.ranks.map((r, i) => {
                  const active = rankIdx === i;
                  return (
                    <button key={r.label} onClick={() => setRankIdx(i)} style={{
                      padding: "7px 4px", border: `1px solid ${active ? accent : "rgba(255,255,255,0.09)"}`,
                      background: active ? `${accent}20` : "rgba(255,255,255,0.03)",
                      color: active ? accent : "rgba(255,255,255,0.45)", fontFamily: MONO, fontSize: 9,
                      cursor: "pointer", borderRadius: 2, textAlign: "center" as const,
                      boxShadow: active ? `0 0 8px ${accent}44` : "none", textTransform: "uppercase" as const,
                      transition: "all 0.15s",
                    }}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* INTEGRANTES */}
          <SLabel>INTEGRANTES</SLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {Array.from({ length: maxP - 1 }, (_, i) => i + 2).map(n => (
              <Pill key={n} label={String(n)} active={slots === n} accent={accent} onClick={() => setSlots(n)} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }}>
            CANCELAR
          </button>
          <button
            onClick={create}
            disabled={isActive}
            style={{
              flex: 2, padding: "11px", background: isActive ? "rgba(255,255,255,0.05)" : accent,
              border: `1px solid ${isActive ? "rgba(255,255,255,0.1)" : accent}`, borderRadius: 2,
              color: isActive ? "rgba(255,255,255,0.3)" : "#000", cursor: isActive ? "not-allowed" : "pointer",
              fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
              boxShadow: isActive ? "none" : `0 0 20px ${accent}44`, transition: "all 0.2s",
            }}
          >
            {isActive ? "LOBBY ACTIVO..." : "CREAR LOBBY"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Setup / Settings screens ─────────────────────────────────────────────────

// SetupScreen — delegates to SettingsScreen (unified design)
function SetupScreen() { return <SettingsScreen isSetup />; }

function _OldSetupScreen_UNUSED({ isSettings = false }: { isSettings?: boolean }) {
  const userGames = usePulseStore(s => s.userGames);
  const userGameIds = usePulseStore(s => s.userGameIds);
  const setUserConfig = usePulseStore(s => s.setUserConfig);
  const setView = usePulseStore(s => s.setView);

  const [step, setStep] = useState(0);
  const [selectedGames, setSelectedGames] = useState<GameTag[]>(isSettings ? userGames : []);
  const [gameIds, setGameIds] = useState<Record<GameTag, Record<string, string>>>(() => {
    if (!isSettings) return {};
    const init: Record<GameTag, Record<string, string>> = {};
    for (const g of userGames) {
      const gid = userGameIds[g];
      if (gid) init[g] = { [gid.platform]: gid.username };
    }
    return init;
  });

  const toggleGame = (id: GameTag) =>
    setSelectedGames(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  const setId = (game: GameTag, platform: string, value: string) =>
    setGameIds(prev => ({ ...prev, [game]: { ...(prev[game] ?? {}), [platform]: value } }));

  const allIdsSet = selectedGames.every(g => {
    const def = GAMES.find(d => d.id === g);
    if (!def) return true;
    return def.platforms.every(p => (gameIds[g]?.[p.id]?.trim() ?? "").length > 0);
  });

  const handleDone = () => {
    const newIds: Record<GameTag, GameID> = {};
    for (const g of selectedGames) {
      const def = GAMES.find(d => d.id === g);
      if (!def) continue;
      const p = def.platforms[0]; if (!p) continue;
      newIds[g] = { platform: p.id, username: gameIds[g]?.[p.id]?.trim() ?? "" };
    }
    setUserConfig(selectedGames, newIds);
    if (isSettings) setView("feed");
  };

  return (
    <div style={{ minHeight: "100vh", background: BG_BASE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: MONO, position: "relative", overflow: "hidden" }}>
      {/* Hex grid bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(0,255,163,0.08) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,255,163,0.04), transparent)", pointerEvents: "none" }} />

      {/* Back button (settings mode) */}
      {isSettings && (
        <button
          onClick={() => setView("feed")}
          style={{ position: "absolute", top: 20, left: 24, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", padding: 0 }}
        >
          ← VOLVER
        </button>
      )}

      {/* Panel */}
      <div style={{ position: "relative", width: 440, background: "rgba(10,10,12,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(0,255,163,0.06)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #00ffa3, transparent)" }} />

        {/* Logo + step label */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "0.14em", color: "#00ffa3", textShadow: "0 0 20px rgba(0,255,163,0.5)", marginBottom: 6 }}>PULSE LFG</div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>
            {step === 0 ? "SELECCIONA TUS JUEGOS" : "CONFIGURA TUS GAME IDs"}
          </div>
          {/* Step dots */}
          <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
            {[0, 1].map(s => (
              <div key={s} style={{ width: s === step ? 20 : 6, height: 6, borderRadius: 3, background: s === step ? "#00ffa3" : "rgba(255,255,255,0.15)", transition: "all 0.2s" }} />
            ))}
          </div>
        </div>

        {/* Step 0: Game selection */}
        {step === 0 && (
          <div style={{ padding: "20px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {GAMES.map(game => {
                const active = selectedGames.includes(game.id);
                return (
                  <button key={game.id} onClick={() => toggleGame(game.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                    background: active ? `${game.color}14` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? `${game.color}55` : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 2, cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s",
                    boxShadow: active ? `0 0 12px ${game.color}22` : "none",
                  }}>
                    <span style={{ fontSize: 18, opacity: active ? 1 : 0.35 }}>{game.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: active ? game.color : "rgba(255,255,255,0.5)", letterSpacing: "0.07em" }}>{game.short}</div>
                      <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.label}</div>
                    </div>
                    {active && <span style={{ color: game.color, fontSize: 14 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <button
              disabled={selectedGames.length === 0}
              onClick={() => setStep(1)}
              style={{
                width: "100%", padding: "13px", background: selectedGames.length > 0 ? "#00ffa3" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedGames.length > 0 ? "#00ffa3" : "rgba(255,255,255,0.08)"}`, borderRadius: 2,
                color: selectedGames.length > 0 ? "#000" : "rgba(255,255,255,0.25)", cursor: selectedGames.length > 0 ? "pointer" : "default",
                fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
                boxShadow: selectedGames.length > 0 ? "0 0 24px rgba(0,255,163,0.3)" : "none", transition: "all 0.2s",
              }}
            >
              SIGUIENTE →
            </button>
          </div>
        )}

        {/* Step 1: ID config */}
        {step === 1 && (
          <div style={{ padding: "20px 28px", maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {selectedGames.map(gameId => {
              const def = GAMES.find(d => d.id === gameId); if (!def) return null;
              return (
                <div key={gameId}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: def.color, fontSize: 16 }}>{def.icon}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: def.color, letterSpacing: "0.07em" }}>{def.short}</span>
                  </div>
                  {def.platforms.map(p => (
                    <div key={p.id}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 6 }}>{p.label.toUpperCase()}</div>
                      <input
                        type="text" placeholder={p.placeholder}
                        value={gameIds[gameId]?.[p.id] ?? ""}
                        onChange={e => setId(gameId, p.id, e.target.value)}
                        style={{
                          width: "100%", fontFamily: MONO, fontSize: 12, color: "rgba(255,255,255,0.9)",
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 2, padding: "9px 12px", outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.15s",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = def.color; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
              <button onClick={() => setStep(0)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em" }}>
                ← ATRÁS
              </button>
              <button
                disabled={!allIdsSet || selectedGames.length === 0}
                onClick={handleDone}
                style={{
                  flex: 1, padding: "10px", background: allIdsSet && selectedGames.length > 0 ? "#00ffa3" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${allIdsSet && selectedGames.length > 0 ? "#00ffa3" : "rgba(255,255,255,0.08)"}`, borderRadius: 2,
                  color: allIdsSet && selectedGames.length > 0 ? "#000" : "rgba(255,255,255,0.25)",
                  cursor: allIdsSet && selectedGames.length > 0 ? "pointer" : "default",
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", transition: "all 0.2s",
                }}
              >
                {isSettings ? "GUARDAR CAMBIOS" : "ENTRAR AL FEED →"}
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, rgba(0,255,163,0.4), transparent)" }} />
      </div>

      <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
        PULSE LFG · EFÍMERO · SIN CUENTA NECESARIA
      </div>
    </div>
  );
}

// ─── Feed Screen ─────────────────────────────────────────────────────────────

function FeedScreen() {
  const cards = usePulseStore(s => s.cards);
  const myCardId = usePulseStore(s => s.myCardId);
  const userGames = usePulseStore(s => s.userGames);
  const connected = usePulseStore(s => s.connected);
  const connectedCount = usePulseStore(s => s.connectedCount);

  // Carousel: cycle through user's configured games
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [modeFilter, setModeFilter] = useState<"All" | GameMode>("All");
  const [rankFilter, setRankFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(id); }, []);

  const userGameDefs = GAMES.filter(g => userGames.includes(g.id));
  const activeGame = userGameDefs[activeIdx % Math.max(userGameDefs.length, 1)];
  const accent = activeGame?.color ?? "#00ffa3";
  const bgImg = activeGame ? BG_IMAGES[activeGame.id] : undefined;

  const jumpTo = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    setVisible(false);
    setTimeout(() => { setActiveIdx(idx); setRankFilter(null); setModeFilter("All"); setVisible(true); }, 200);
  }, [activeIdx]);

  const navigate = useCallback((dir: 1 | -1) => jumpTo((activeIdx + dir + userGameDefs.length) % Math.max(userGameDefs.length, 1)), [activeIdx, jumpTo, userGameDefs.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") navigate(-1); if (e.key === "ArrowRight") navigate(1); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Filter lobby cards
  const now = Math.floor(Date.now() / 1000);
  const lobbies = cards.filter(c => {
    if (c.id === myCardId) return false;
    if (now - c.created_at >= CARD_TTL_SECS) return false;
    if (activeGame && c.game !== activeGame.id) return false;
    if (modeFilter !== "All" && c.mode !== modeFilter) return false;
    if (rankFilter && c.mode === "Ranked" && c.rank.label !== rankFilter) return false;
    return true;
  });

  const panelOpacity = visible ? 1 : 0;

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}>
        {bgImg ? (
          <img src={bgImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `radial-gradient(ellipse 60% 80% at 30% 50%, ${accent}22, ${BG_BASE})` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,10,12,0.72) 0%, rgba(10,10,12,0.55) 50%, rgba(10,10,12,0.88) 60%, rgba(10,10,12,0.96) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, ${accent}18 1px, transparent 1px)`, backgroundSize: "28px 28px", pointerEvents: "none" }} />
      </div>

      {/* Header */}
      <header style={{ position: "relative", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 60, background: "rgba(10,10,12,0.65)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#00ff88" : "#ff4d6a", boxShadow: connected ? "0 0 8px #00ff88" : "none" }} />
          <span style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: "0.14em", color: "#f9f5f8" }}>PULSE LFG</span>
        </div>

        {/* Carousel dots */}
        {userGameDefs.length > 1 && (
          <div style={{ display: "flex", gap: 5, alignItems: "center", opacity: panelOpacity, transition: "opacity 0.22s" }}>
            {userGameDefs.map((_, i) => (
              <button key={i} onClick={() => jumpTo(i)} style={{ width: i === activeIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? accent : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s", boxShadow: i === activeIdx ? `0 0 8px ${accent}99` : "none" }} />
            ))}
          </div>
        )}

        {/* Right: connected count + settings */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#00ff88" : "#ff4d6a", display: "inline-block" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em" }}>{connectedCount}</span>
          </div>
          <button
            onClick={() => usePulseStore.getState().setView("settings")}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", padding: "7px 12px", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f9f5f8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            ⚙ AJUSTES
          </button>
        </div>
      </header>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: carousel game title */}
        <section style={{
          flex: "0 0 60%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "32px 80px 48px",
          opacity: panelOpacity, transform: visible ? "translateX(0)" : "translateX(-16px)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}>
          {/* Left nav arrow */}
          {userGameDefs.length > 1 && <NavArrow dir="left" accent={accent} onClick={() => navigate(-1)} />}

          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.5em", color: accent, marginBottom: 12, textTransform: "uppercase" as const }}>
            {userGameDefs.length > 1 ? "NAVEGANDO JUEGOS" : "TU JUEGO"}
          </div>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontSize: "clamp(40px, 6.5vw, 88px)", lineHeight: 0.92, letterSpacing: "0.03em", color: "#f9f5f8", textShadow: `0 0 60px ${accent}55`, textTransform: "uppercase" as const, maxWidth: "85%" }}>
            {activeGame?.label ?? "SIN JUEGOS"}
          </h1>
          <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}>
            {activeGame ? GAMES.find(g => g.id === activeGame.id)?.platforms[0]?.label ?? "" : ""}
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <StatPill label={`${connectedCount} EN LÍNEA`} />
            <StatPill label={`${lobbies.length} LOBBY${lobbies.length !== 1 ? "S" : ""}`} />
          </div>

          {userGameDefs.length > 1 && <NavArrow dir="right" accent={accent} onClick={() => navigate(1)} />}
        </section>

        {/* RIGHT: glass panel — filters + lobby list */}
        <aside style={{
          flex: "0 0 40%", background: "rgba(10,10,12,0.75)", backdropFilter: "blur(40px)",
          borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column",
          padding: "24px 28px", overflowY: "auto", opacity: panelOpacity, transition: "opacity 0.22s ease",
        }}>
          {/* Game label */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>BUSCAR PARTIDA</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.06em", color: accent, textShadow: `0 0 18px ${accent}66`, lineHeight: 1 }}>{activeGame?.label?.toUpperCase() ?? "—"}</div>
          </div>

          {/* MODO filter */}
          <div style={{ marginBottom: 20 }}>
            <SLabel>MODO</SLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(["All", "Casual", "Ranked"] as const).map(m => (
                <Pill key={m} label={m === "All" ? "TODOS" : m} active={modeFilter === m} accent={accent} onClick={() => { setModeFilter(m); setRankFilter(null); }} />
              ))}
            </div>
          </div>

          {/* RANGO filter (only when Ranked) */}
          {modeFilter === "Ranked" && activeGame && activeGame.ranks.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SLabel>RANGO</SLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, maxHeight: 140, overflowY: "auto" }}>
                {activeGame.ranks.map(r => {
                  const active = rankFilter === r.label;
                  return (
                    <button key={r.label} onClick={() => setRankFilter(active ? null : r.label)} style={{
                      padding: "7px 3px", border: `1px solid ${active ? accent : "rgba(255,255,255,0.08)"}`,
                      background: active ? `${accent}20` : "rgba(255,255,255,0.03)",
                      color: active ? accent : "rgba(255,255,255,0.4)", fontFamily: MONO, fontSize: 9,
                      cursor: "pointer", borderRadius: 2, textAlign: "center" as const,
                      boxShadow: active ? `0 0 8px ${accent}44` : "none", textTransform: "uppercase" as const, transition: "all 0.15s",
                    }}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lobby list */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {!activeGame ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontFamily: MONO, fontSize: 11 }}>
                Sin juegos configurados.<br />Ve a Ajustes para agregar juegos.
              </div>
            ) : lobbies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 32, color: "rgba(255,255,255,0.1)", marginBottom: 8 }}>◌</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>SIN LOBBIES ACTIVOS</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>Crea uno para empezar</div>
              </div>
            ) : (
              lobbies.map(card => <LobbyCard key={card.id} card={card} accent={accent} />)
            )}
          </div>

          {/* Create lobby button */}
          <button
            onClick={() => setShowCreate(true)}
            disabled={!activeGame || !!myCardId}
            style={{
              width: "100%", padding: "14px",
              background: !activeGame || !!myCardId ? "rgba(255,255,255,0.04)" : accent,
              border: `1px solid ${!activeGame || !!myCardId ? "rgba(255,255,255,0.08)" : accent}`,
              borderRadius: 2, color: !activeGame || !!myCardId ? "rgba(255,255,255,0.25)" : "#000",
              cursor: !activeGame || !!myCardId ? "not-allowed" : "pointer",
              fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em",
              boxShadow: activeGame && !myCardId ? `0 0 24px ${accent}44` : "none", transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (activeGame && !myCardId) (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 36px ${accent}66`; }}
            onMouseLeave={e => { if (activeGame && !myCardId) (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px ${accent}44`; }}
          >
            {myCardId ? "LOBBY ACTIVO..." : "+ CREAR LOBBY"}
          </button>
        </aside>
      </div>

      {/* Create lobby modal */}
      {showCreate && activeGame && (
        <CreateLobbyModal gameId={activeGame.id} accent={accent} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function StatPill({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "rgba(10,10,12,0.65)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, backdropFilter: "blur(10px)" }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>{label}</span>
    </div>
  );
}

function NavArrow({ dir, accent, onClick }: { dir: "left" | "right"; accent: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      position: "absolute" as const, [dir]: dir === "left" ? 14 : 18, top: "50%", transform: "translateY(-50%)",
      zIndex: 30, background: hov ? `${accent}22` : "rgba(0,0,0,0.45)", border: `1px solid ${hov ? accent : "rgba(255,255,255,0.1)"}`,
      borderRadius: 2, width: 42, height: 42, cursor: "pointer", fontSize: 16, color: hov ? accent : "rgba(255,255,255,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
      boxShadow: hov ? `0 0 14px ${accent}55` : "none", lineHeight: 1,
    }}>
      {dir === "left" ? "◀" : "▶"}
    </button>
  );
}

// ─── Settings Screen (Game Tags) ─────────────────────────────────────────────

const GEAR_PATH = "M50 15C47.2 15 45 17.2 45 20V23.1C42 24.1 39.2 25.7 36.7 27.7L34.5 25.5C32.5 23.5 29.3 23.5 27.3 25.5L25.5 27.3C23.5 29.3 23.5 32.5 25.5 34.5L27.7 36.7C25.7 39.2 24.1 42 23.1 45H20C17.2 45 15 47.2 15 50C15 52.8 17.2 55 20 55H23.1C24.1 58 25.7 60.8 27.7 63.3L25.5 65.5C23.5 67.5 23.5 70.7 25.5 72.7L27.3 74.5C29.3 76.5 32.5 76.5 34.5 74.5L36.7 72.3C39.2 74.3 42 75.9 45 76.9V80C45 82.8 47.2 85 50 85C52.8 85 55 82.8 55 80V76.9C58 75.9 60.8 74.3 63.3 72.3L65.5 74.5C67.5 76.5 70.7 76.5 72.7 74.5L74.5 72.7C76.5 70.7 76.5 67.5 74.5 65.5L72.3 63.3C74.3 60.8 75.9 58 76.9 55H80C82.8 55 85 52.8 85 50C85 47.2 82.8 45 80 45H76.9C75.9 42 74.3 39.2 72.3 36.7L74.5 34.5C76.5 32.5 76.5 29.3 74.5 27.3L72.7 25.5C70.7 23.5 67.5 23.5 65.5 25.5L63.3 27.7C60.8 25.7 58 24.1 55 23.1V20C55 17.2 52.8 15 50 15ZM50 35C58.3 35 65 41.7 65 50C65 58.3 58.3 65 50 65C41.7 65 35 58.3 35 50C35 41.7 41.7 35 50 35Z";

function GearSVG({ size, spin, color = "rgba(255,255,255,0.18)" }: { size: number; spin: "cw" | "ccw" | "none"; color?: string }) {
  const anim =
    spin === "cw" ? "gear-cw 2s linear infinite" :
    spin === "ccw" ? "gear-ccw 2.5s linear infinite" : "none";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ animation: anim, display: "block", filter: spin !== "none" ? `drop-shadow(0 0 6px ${color})` : "none" }}>
      <path d={GEAR_PATH} stroke={color} strokeWidth="2" />
    </svg>
  );
}

function GameLogoIcon({ gameId, color, size = 36, active = false }: { gameId: string; color: string; size?: number; active?: boolean }) {
  const logo = GAME_LOGOS[gameId];
  return (
    <div style={{
      width: size, height: size, borderRadius: 2, flexShrink: 0, overflow: "hidden",
      border: `1px solid ${active ? `${color}66` : "rgba(255,255,255,0.1)"}`,
      background: logo ? "transparent" : (active ? `${color}22` : "rgba(255,255,255,0.05)"),
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: active ? `0 0 8px ${color}33` : "none",
    }}>
      {logo
        ? <img src={logo} alt={gameId} style={{ width: "100%", height: "100%", objectFit: "cover", filter: active ? "none" : "grayscale(60%) brightness(0.6)" }} />
        : <span style={{ fontFamily: MONO, fontSize: size * 0.27, fontWeight: 700, color: active ? color : "rgba(255,255,255,0.35)" }}>
            {GAMES.find(g => g.id === gameId)?.short ?? "?"}
          </span>
      }
    </div>
  );
}

function SettingsScreen({ isSetup = false }: { isSetup?: boolean }) {
  const userGameIds = usePulseStore(s => s.userGameIds);
  const userGames = usePulseStore(s => s.userGames);
  const setUserConfig = usePulseStore(s => s.setUserConfig);
  const setView = usePulseStore(s => s.setView);

  const [localIds, setLocalIds] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of GAMES) {
      const gid = userGameIds[g.id as GameTag];
      if (gid) init[g.id] = gid.username;
    }
    return init;
  });

  const [selectedGame, setSelectedGame] = useState<string>(GAMES[0].id);
  const [spinning, setSpinning] = useState(false);
  const [synced, setSynced] = useState(false);

  const selectedDef = GAMES.find(g => g.id === selectedGame) ?? GAMES[0];
  const platform = selectedDef.platforms[0];

  const hasAnyTag = GAMES.some(g => localIds[g.id]?.trim());
  const canSave = !isSetup || hasAnyTag;

  const handleSave = () => {
    if (spinning || !canSave) return;
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setSynced(true);
      const newGames: GameTag[] = GAMES
        .filter(g => localIds[g.id]?.trim())
        .map(g => g.id as GameTag);
      const newIds: Record<GameTag, GameID> = {};
      for (const g of GAMES) {
        const val = localIds[g.id]?.trim();
        if (val) newIds[g.id as GameTag] = { platform: g.platforms[0].id, username: val };
      }
      setUserConfig(newGames.length > 0 ? newGames : userGames, newIds);
      setTimeout(() => { setSynced(false); setView("feed"); }, 1500);
    }, 2000);
  };

  const accent = "#00ffa3";

  return (
    <div style={{ minHeight: "100vh", background: BG_BASE, fontFamily: MONO, color: "#f9f5f8", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes gear-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gear-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>
      {/* Hex bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(0,255,163,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 10 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.12em", color: accent, textShadow: `0 0 16px ${accent}55` }}>Macu</div>
          <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            {isSetup ? "CONFIGURA TUS GAME TAGS PARA COMENZAR" : "CONFIGURA TUS GAME TAGS"}
          </div>
        </div>
        {!isSetup && (
          <button onClick={() => setView("feed")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em" }}>
            ← VOLVER
          </button>
        )}
      </header>

      {/* 3-column main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: 0, maxWidth: 900, width: "100%" }}>

          {/* ─── Left: Game list ─── */}
          <div style={{ flex: "0 0 280px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px 0 0 4px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>PASO 01</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: "0.1em", color: accent }}>GAME</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {GAMES.map(game => {
                const isActive = selectedGame === game.id;
                const hasTag = !!localIds[game.id]?.trim();
                return (
                  <button key={game.id} onClick={() => setSelectedGame(game.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                    background: isActive ? `${game.color}12` : "transparent",
                    border: "none", borderLeft: `3px solid ${isActive ? game.color : "transparent"}`,
                    cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s",
                    boxShadow: isActive ? `inset 0 0 20px ${game.color}08` : "none",
                  }}>
                    <GameLogoIcon gameId={game.id} color={game.color} size={38} active={isActive} />
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? "#f9f5f8" : "rgba(255,255,255,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{game.label}</span>
                    {hasTag && <span style={{ color: game.color, fontSize: 12, flexShrink: 0 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Center: Gears + Save ─── */}
          <div style={{ flex: "0 0 140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 0", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, borderLeft: "1px dashed rgba(255,255,255,0.07)", pointerEvents: "none" }} />
            <GearSVG size={72} spin={spinning ? "cw" : "none"} color={spinning ? accent : "rgba(255,255,255,0.15)"} />
            <GearSVG size={48} spin={spinning ? "ccw" : "none"} color={spinning ? `${accent}99` : "rgba(255,255,255,0.1)"} />
            <GearSVG size={32} spin={spinning ? "cw" : "none"} color={spinning ? `${accent}66` : "rgba(255,255,255,0.07)"} />
            <button
              onClick={handleSave}
              disabled={!canSave || spinning || synced}
              style={{
                marginTop: 12, padding: "8px 16px",
                background: synced ? accent : "transparent",
                border: `1px solid ${!canSave ? "rgba(255,255,255,0.1)" : synced ? accent : spinning ? `${accent}88` : "rgba(255,255,255,0.2)"}`,
                borderRadius: 2, color: synced ? "#000" : canSave ? accent : "rgba(255,255,255,0.2)",
                fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
                cursor: !canSave || spinning || synced ? "default" : "pointer",
                boxShadow: synced ? `0 0 20px ${accent}55` : spinning ? `0 0 12px ${accent}33` : "none",
                transition: "all 0.2s",
              }}
            >
              {synced ? "✓ SYNCED" : isSetup ? "ENTRAR →" : "SAVE"}
            </button>
            {isSetup && !hasAnyTag && (
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textAlign: "center", padding: "0 8px" }}>
                CONFIGURA<br/>AL MENOS 1 TAG
              </div>
            )}
          </div>

          {/* ─── Right: Tag input ─── */}
          <div style={{ flex: "0 0 280px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 4px 4px 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>PASO 02</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: "0.1em", color: accent }}>TAG</div>
            </div>

            <div style={{ flex: 1, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Selected game header with logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: `${selectedDef.color}0a`, border: `1px solid ${selectedDef.color}33`, borderRadius: 2 }}>
                <GameLogoIcon gameId={selectedDef.id} color={selectedDef.color} size={44} active />
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: "0.1em", color: selectedDef.color }}>{selectedDef.label.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", marginTop: 2 }}>{platform.label.toUpperCase()}</div>
                </div>
              </div>

              {/* Input */}
              <input
                key={selectedGame}
                type="text"
                placeholder={platform.placeholder}
                value={localIds[selectedGame] ?? ""}
                onChange={e => setLocalIds(prev => ({ ...prev, [selectedGame]: e.target.value }))}
                style={{
                  width: "100%", fontFamily: MONO, fontSize: 12, color: "#f9f5f8",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${selectedDef.color}44`,
                  borderRadius: 2, padding: "10px 12px", outline: "none", boxSizing: "border-box" as const,
                  transition: "all 0.15s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = selectedDef.color; e.currentTarget.style.boxShadow = `0 0 8px ${selectedDef.color}33`; }}
                onBlur={e => { e.currentTarget.style.borderColor = `${selectedDef.color}44`; e.currentTarget.style.boxShadow = "none"; }}
              />

              {/* All tags summary */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
                {GAMES.map(g => {
                  const tag = localIds[g.id]?.trim();
                  const isThis = g.id === selectedGame;
                  return (
                    <div key={g.id} onClick={() => setSelectedGame(g.id)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                      background: isThis ? `${g.color}10` : "transparent",
                      border: `1px solid ${isThis ? `${g.color}33` : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 2, cursor: "pointer", transition: "all 0.12s",
                    }}>
                      <GameLogoIcon gameId={g.id} color={g.color} size={22} active={isThis} />
                      <span style={{ fontFamily: MONO, fontSize: 10, color: tag ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {tag ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "12px 0", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.18)", position: "relative", zIndex: 10 }}>
        Macu · TUS TAGS SE SINCRONIZAN AUTOMÁTICAMENTE
      </footer>
    </div>
  );
}

// ─── Root WebApp ──────────────────────────────────────────────────────────────

export function WebApp() {
  useWebSocket();
  const view = usePulseStore(s => s.view);
  const handshake = usePulseStore(s => s.handshake);

  return (
    <div style={{ minHeight: "100vh", background: BG_BASE, fontFamily: MONO, color: "#f9f5f8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {view === "setup" && <SetupScreen />}
      {view === "settings" && <SettingsScreen />}
      {view === "feed" && <FeedScreen />}

      {/* Lobby room renders over everything */}
      {handshake && <LobbyRoomOverlay />}
    </div>
  );
}
