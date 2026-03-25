import { useState, useEffect } from "react";
import { GAMES } from "../data/games";

// ─── Design tokens (standalone, no T import so landing stays self-contained) ──
const L = {
  bg: "#080808",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  accent: "#00ffa3",
  accentDim: "rgba(0,255,163,0.12)",
  blue: "#00cfff",
  text: "#e8e8e8",
  textSub: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.3)",
  mono: "'IBM Plex Mono', monospace",
  sans: "'DM Sans', sans-serif",
};

// Download URL — update after building the .exe and uploading to GitHub Releases
const DOWNLOAD_URL = "https://github.com/pulse-lfg/pulse-lfg/releases/latest/download/Pulse-LFG_x64-setup.exe";

// ─── Mock cards for hero preview ─────────────────────────────────────────────
const MOCK_CARDS = [
  { game: "Valorant", short: "VAL", icon: "🎮", color: "#ff4655", mode: "RANKED", rank: "Diamond", ttl: 72 },
  { game: "CS2", short: "CS2", icon: "🔫", color: "#e8a249", mode: "FACEIT", rank: "Level 8", ttl: 45 },
  { game: "LeagueOfLegends", short: "LoL", icon: "⚔️", color: "#c89b3c", mode: "RANKED", rank: "Platinum", ttl: 88 },
];

function MockCard({ card, delay }: { card: typeof MOCK_CARDS[0]; delay: number }) {
  const ttlColor = card.ttl > 60 ? L.accent : card.ttl > 30 ? "#ffaa2e" : "#ff4d6a";
  return (
    <div
      className="card-enter"
      style={{
        background: "rgba(14,14,14,0.9)",
        border: `1px solid ${L.border}`,
        borderRadius: 8,
        padding: "12px 14px",
        width: 220,
        backdropFilter: "blur(12px)",
        animationDelay: `${delay}ms`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            background: `${card.color}22`,
            border: `1px solid ${card.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
          }}
        >
          {card.icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: L.mono,
              fontSize: 10,
              fontWeight: 600,
              color: card.color,
              letterSpacing: "0.06em",
            }}
          >
            {card.short}
          </div>
          <div style={{ fontFamily: L.mono, fontSize: 8, color: L.textDim, letterSpacing: "0.05em" }}>
            {card.mode}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: L.mono,
            fontSize: 9,
            color: L.textSub,
            letterSpacing: "0.04em",
          }}
        >
          {card.rank}
        </div>
      </div>
      {/* TTL bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
        <div
          style={{
            height: "100%",
            width: `${card.ttl}%`,
            background: ttlColor,
            borderRadius: 1,
            transition: "width 1s linear",
            boxShadow: `0 0 6px ${ttlColor}88`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        padding: "20px 22px",
        background: L.surface,
        border: `1px solid ${L.border}`,
        borderRadius: 10,
        transition: "background 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = L.surfaceHover;
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = L.surface;
        (e.currentTarget as HTMLDivElement).style.borderColor = L.border;
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div
        style={{
          fontFamily: L.mono,
          fontSize: 11,
          fontWeight: 600,
          color: L.text,
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: L.sans, fontSize: 13, color: L.textSub, lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: L.accentDim,
          border: `1px solid ${L.accent}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: L.mono,
          fontSize: 12,
          fontWeight: 700,
          color: L.accent,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div>
        <div
          style={{
            fontFamily: L.mono,
            fontSize: 12,
            fontWeight: 600,
            color: L.text,
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div style={{ fontFamily: L.sans, fontSize: 13, color: L.textSub, lineHeight: 1.6 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: L.bg, minHeight: "100vh", color: L.text, overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${L.border}` : "1px solid transparent",
          transition: "all 0.3s",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: L.mono,
              fontSize: 15,
              fontWeight: 700,
              background: `linear-gradient(90deg, ${L.accent}, ${L.blue})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.1em",
            }}
          >
            PULSE
          </span>
          <span
            style={{
              fontFamily: L.mono,
              fontSize: 9,
              color: L.textDim,
              letterSpacing: "0.15em",
              paddingTop: 2,
            }}
          >
            LFG
          </span>
        </div>

        {/* Nav CTAs */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href={DOWNLOAD_URL}
            style={{
              fontFamily: L.mono,
              fontSize: 10,
              color: L.textSub,
              textDecoration: "none",
              letterSpacing: "0.06em",
              padding: "6px 12px",
              border: `1px solid ${L.border}`,
              borderRadius: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = L.text;
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = L.textSub;
              (e.currentTarget as HTMLAnchorElement).style.borderColor = L.border;
            }}
          >
            ⬇ WINDOWS
          </a>
          <button
            onClick={onLaunch}
            style={{
              fontFamily: L.mono,
              fontSize: 10,
              fontWeight: 700,
              color: "#000",
              background: L.accent,
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            LAUNCH APP ↗
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "80px 24px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 28,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            background: L.accentDim,
            border: `1px solid ${L.accent}33`,
            borderRadius: 20,
            fontFamily: L.mono,
            fontSize: 9,
            color: L.accent,
            letterSpacing: "0.12em",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: L.accent, display: "inline-block" }} />
          REAL-TIME · EPHEMERAL · NO ACCOUNT
        </div>

        {/* Headline */}
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: L.sans,
              fontWeight: 700,
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: L.text,
            }}
          >
            Find your squad.
            <br />
            <span
              style={{
                background: `linear-gradient(90deg, ${L.accent}, ${L.blue}, ${L.accent})`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradientShift 4s linear infinite",
              }}
            >
              Zero friction.
            </span>
          </h1>
          <p
            style={{
              margin: "18px auto 0",
              maxWidth: 520,
              fontFamily: L.sans,
              fontSize: 17,
              color: L.textSub,
              lineHeight: 1.65,
            }}
          >
            Broadcast a 5-minute signal card. Match with real players in real time.
            No accounts, no chat — just a handshake and a Game ID.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={onLaunch}
            style={{
              fontFamily: L.mono,
              fontSize: 12,
              fontWeight: 700,
              color: "#000",
              background: L.accent,
              border: "none",
              borderRadius: 8,
              padding: "13px 28px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              boxShadow: `0 0 24px ${L.accent}44`,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 40px ${L.accent}66`;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px ${L.accent}44`;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            ▶ LAUNCH IN BROWSER
          </button>
          <a
            href={DOWNLOAD_URL}
            style={{
              fontFamily: L.mono,
              fontSize: 12,
              fontWeight: 600,
              color: L.text,
              background: L.surface,
              border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 8,
              padding: "13px 28px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textDecoration: "none",
              transition: "all 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = L.surfaceHover;
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = L.surface;
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            ⬇ DOWNLOAD FOR WINDOWS
          </a>
        </div>

        {/* Mock card feed preview */}
        <div
          style={{
            position: "relative",
            marginTop: 12,
            width: "100%",
            maxWidth: 720,
          }}
        >
          {/* Fade edges */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 60,
              background: `linear-gradient(90deg, ${L.bg}, transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 60,
              background: `linear-gradient(270deg, ${L.bg}, transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

          {/* Cards row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "16px 40px",
              overflowX: "auto",
              scrollbarWidth: "none",
              justifyContent: "center",
            }}
          >
            {MOCK_CARDS.map((card, i) => (
              <MockCard key={card.game} card={card} delay={i * 120} />
            ))}
          </div>

          {/* Glow behind cards */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${L.accent}08, transparent)`,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Game logos strip */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {GAMES.map((g) => (
            <div
              key={g.id}
              title={g.label}
              style={{
                fontFamily: L.mono,
                fontSize: 9,
                color: g.color,
                letterSpacing: "0.1em",
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ fontSize: 13 }}>{g.icon}</span>
              {g.short}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 24px",
          borderTop: `1px solid ${L.border}`,
        }}
      >
        <div
          style={{
            fontFamily: L.mono,
            fontSize: 10,
            color: L.textDim,
            letterSpacing: "0.15em",
            marginBottom: 36,
            textAlign: "center",
          }}
        >
          WHY PULSE
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          <Feature
            icon="⚡"
            title="REAL-TIME WEBSOCKET"
            desc="Cards appear and disappear instantly. No polling, no page refresh — just a live feed."
          />
          <Feature
            icon="🔒"
            title="ZERO ACCOUNTS"
            desc="Nothing is stored. No email, no password, no profile. Open the app and you're live."
          />
          <Feature
            icon="💨"
            title="5-MINUTE TTL"
            desc="Every signal card auto-expires. The feed stays fresh and spamless without moderation."
          />
          <Feature
            icon="🤝"
            title="DIRECT HANDSHAKE"
            desc="JOIN a card → both players exchange Game IDs via a one-time encrypted handshake. No middleman."
          />
          <Feature
            icon="🎮"
            title="6 GAMES"
            desc="Valorant, League of Legends, CS2, Dota 2, Apex Legends, Overwatch 2 — with rank filtering."
          />
          <Feature
            icon="🖥️"
            title="NATIVE DESKTOP"
            desc="Install the lightweight Tauri app (Windows) for a persistent tray experience. Or just use the browser."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 24px",
          borderTop: `1px solid ${L.border}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: L.mono,
              fontSize: 10,
              color: L.textDim,
              letterSpacing: "0.15em",
              marginBottom: 28,
            }}
          >
            HOW IT WORKS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Step
              n={1}
              title="SELECT YOUR GAME + RANK"
              desc="Choose the game you want to play, pick your mode (Ranked or Casual), and your rank tier."
            />
            <Step
              n={2}
              title="BROADCAST A SIGNAL CARD"
              desc='Hit "SEND SIGNAL". Your card appears in the live feed for all players subscribed to that game. It expires in 5 minutes.'
            />
            <Step
              n={3}
              title="MATCH — EXCHANGE IDs — PLAY"
              desc="See a compatible card? Hit JOIN. Both players get each other's in-game ID via a private handshake. Copy, paste, queue."
            />
          </div>
        </div>

        {/* Terminal-style diagram */}
        <div
          style={{
            background: "rgba(10,10,10,0.8)",
            border: `1px solid ${L.border}`,
            borderRadius: 12,
            padding: "20px 24px",
            fontFamily: L.mono,
            fontSize: 11,
            lineHeight: 1.9,
          }}
        >
          <div style={{ color: L.textDim, marginBottom: 12, fontSize: 10 }}>
            <span style={{ color: L.accent }}>●</span>{" "}
            <span style={{ color: "#ffaa2e" }}>●</span>{" "}
            <span style={{ color: "#ff4d6a" }}>●</span>
            {"  "}pulse-lfg
          </div>
          <div><span style={{ color: L.textDim }}>$ </span><span style={{ color: L.text }}>publish --game valorant --rank diamond</span></div>
          <div style={{ color: L.accent }}>✓ Signal live — expires in 5:00</div>
          <div style={{ height: 10 }} />
          <div><span style={{ color: L.textDim }}>$ </span><span style={{ color: L.text }}>feed --game valorant</span></div>
          <div style={{ color: L.textSub }}>📡 xX_PLayer#001  RANKED · Plat  4m12s</div>
          <div style={{ color: L.textSub }}>📡 FragMaster#VAL  RANKED · Diamond  2m47s</div>
          <div style={{ height: 10 }} />
          <div><span style={{ color: L.textDim }}>$ </span><span style={{ color: L.text }}>join FragMaster#VAL</span></div>
          <div style={{ color: L.accent }}>✓ Handshake complete</div>
          <div style={{ color: L.textSub }}>   Host ID: <span style={{ color: L.text }}>FragMaster#VAL1</span></div>
          <div style={{ color: L.textDim }}>   Copy → paste in client → queue</div>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section
        style={{
          padding: "80px 24px",
          borderTop: `1px solid ${L.border}`,
          textAlign: "center",
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${L.accent}06, transparent)`,
        }}
      >
        <div
          style={{
            fontFamily: L.mono,
            fontSize: 10,
            color: L.textDim,
            letterSpacing: "0.15em",
            marginBottom: 20,
          }}
        >
          GET STARTED NOW
        </div>
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: L.sans,
            fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)",
            color: L.text,
          }}
        >
          Ready to find your squad?
        </h2>
        <p
          style={{
            margin: "0 auto 36px",
            maxWidth: 440,
            fontFamily: L.sans,
            fontSize: 15,
            color: L.textSub,
            lineHeight: 1.6,
          }}
        >
          No install required — launch in your browser right now. Or download
          the native desktop app for Windows.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onLaunch}
            style={{
              fontFamily: L.mono,
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              background: L.accent,
              border: "none",
              borderRadius: 8,
              padding: "15px 36px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              boxShadow: `0 0 32px ${L.accent}44`,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 48px ${L.accent}66`;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 32px ${L.accent}44`;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            ▶ LAUNCH IN BROWSER — FREE
          </button>
          <a
            href={DOWNLOAD_URL}
            style={{
              fontFamily: L.mono,
              fontSize: 13,
              fontWeight: 600,
              color: L.text,
              background: L.surface,
              border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 8,
              padding: "15px 36px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textDecoration: "none",
              transition: "all 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = L.surfaceHover;
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = L.surface;
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            ⬇ WINDOWS .EXE
          </a>
        </div>
        <p
          style={{
            marginTop: 16,
            fontFamily: L.mono,
            fontSize: 9,
            color: L.textDim,
            letterSpacing: "0.06em",
          }}
        >
          Windows 10+ · WebView2 required (pre-installed on Win11) · ~8MB
        </p>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: `1px solid ${L.border}`,
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: L.mono,
              fontSize: 12,
              fontWeight: 700,
              background: `linear-gradient(90deg, ${L.accent}, ${L.blue})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.1em",
            }}
          >
            PULSE LFG
          </span>
          <span style={{ fontFamily: L.mono, fontSize: 9, color: L.textDim }}>v0.1.0</span>
        </div>
        <div
          style={{
            fontFamily: L.mono,
            fontSize: 9,
            color: L.textDim,
            letterSpacing: "0.08em",
            display: "flex",
            gap: 20,
          }}
        >
          <span>BUILT WITH RUST + REACT</span>
          <span>TAURI DESKTOP</span>
          <span>OPEN SOURCE</span>
        </div>
        <button
          onClick={onLaunch}
          style={{
            fontFamily: L.mono,
            fontSize: 9,
            color: L.accent,
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.08em",
            padding: 0,
          }}
        >
          LAUNCH APP →
        </button>
      </footer>
    </div>
  );
}
