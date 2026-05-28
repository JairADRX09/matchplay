/**
 * LandingPage — MACU Protocol
 * Dark tactical aesthetic. 7 animated parallelogram columns, centered hero CTA.
 * 100vw × 100vh, overflow hidden, no scroll.
 */
import { useState } from "react";

import valorantBg   from "../images/valoranthd.jpg";
import fortniteBg   from "../images/fortnitehd.jpg";
import lolBg        from "../images/lolhd.jpg";
import cs2Bg        from "../images/cs2hd.jpg";
import apexBg       from "../images/apexhd.jpg";
import overwatchBg  from "../images/overwatchhd.jpg";
import rocketBg     from "../images/rocketlhd.jpg";
import marvelBg     from "../images/marvelrhd.jpg";

const DOWNLOAD_URL =
  "https://github.com/pulse-lfg/pulse-lfg/releases/latest/download/Pulse-LFG_x64-setup.exe";

const RED    = "#FF4655";
const DARK   = "#121414";
const MONO   = "'JetBrains Mono', monospace";
const DISPLAY = "'Anybody', Impact, sans-serif";

// ── Column image pools (shuffled so each column looks unique) ─────────────────
const ALL = [valorantBg, cs2Bg, apexBg, lolBg, overwatchBg, fortniteBg, marvelBg, rocketBg];

function makePool(offset: number): string[] {
  const rotated = [...ALL.slice(offset), ...ALL.slice(0, offset)];
  // Duplicate so we have enough for the seamless 200% loop
  return [...rotated, ...rotated, ...rotated];
}

const COLUMNS: Array<{ images: string[]; dir: "up" | "down"; duration: number }> = [
  { images: makePool(0), dir: "up",   duration: 28 },
  { images: makePool(3), dir: "down", duration: 32 },
  { images: makePool(1), dir: "up",   duration: 25 },
  { images: makePool(5), dir: "down", duration: 30 },
  { images: makePool(2), dir: "up",   duration: 27 },
  { images: makePool(6), dir: "down", duration: 33 },
  { images: makePool(4), dir: "up",   duration: 26 },
];

// CSS injected once
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Anybody:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes scroll-up {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes scroll-down {
    0%   { transform: translateY(-50%); }
    100% { transform: translateY(0); }
  }
  @keyframes glow-pulse {
    0%, 100% { text-shadow: 0 0 40px ${RED}cc, 0 0 80px ${RED}66, 0 0 120px ${RED}33; }
    50%       { text-shadow: 0 0 60px ${RED}ff, 0 0 100px ${RED}88, 0 0 160px ${RED}44; }
  }
  @keyframes btn-glow {
    0%, 100% { box-shadow: 0 0 20px ${RED}88, 0 0 40px ${RED}44; }
    50%       { box-shadow: 0 0 30px ${RED}cc, 0 0 60px ${RED}66; }
  }
  @keyframes status-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  .macu-btn-get:hover {
    box-shadow: 0 0 36px ${RED}ee, 0 0 70px ${RED}77 !important;
    transform: translateY(-2px) scale(1.04) !important;
  }
  .macu-btn-launch:hover {
    background: rgba(255,255,255,0.08) !important;
    transform: translateY(-2px) !important;
  }
  .macu-nav-link:hover { color: rgba(255,255,255,0.9) !important; }
`;

// ── Column component ──────────────────────────────────────────────────────────
function ParallaxColumn({
  images,
  dir,
  duration,
  skewDeg,
}: {
  images: string[];
  dir: "up" | "down";
  duration: number;
  skewDeg: number;
}) {
  const CELL_H = 220; // px per cell
  const GAP    = 6;

  return (
    <div
      style={{
        flex: "1 0 0",
        overflow: "hidden",
        transform: `skewX(${skewDeg}deg)`,
        // extend height slightly beyond viewport to avoid gaps at top/bottom edges
        marginTop: -40,
        marginBottom: -40,
        height: "calc(100% + 80px)",
      }}
    >
      {/* Inner strip — 2× height for seamless loop */}
      <div
        style={{
          animation: `${dir === "up" ? "scroll-up" : "scroll-down"} ${duration}s linear infinite`,
          willChange: "transform",
          display: "flex",
          flexDirection: "column",
          gap: GAP,
        }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            style={{
              height: CELL_H,
              overflow: "hidden",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                // counter-skew the image so it appears straight inside the slanted column
                transform: `skewX(${-skewDeg}deg) scale(1.25)`,
                filter: "brightness(1.25) contrast(1.05)",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [navHover, setNavHover] = useState<string | null>(null);

  const NAV_LINKS = ["RECRUIT", "MODES", "COMMUNITY", "SHOP"];
  // Skew each column slightly differently for visual depth
  const SKEWS = [-10, -10, -10, -10, -10, -10, -10];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: DARK,
        position: "relative",
        fontFamily: MONO,
        color: "#f9f5f8",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── ANIMATED BACKGROUND GRID ─────────────────────────────────────── */}
      {/* Extends 6% beyond each side so parallelogram edges are never bare */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-6%",
          width: "112%",
          height: "100%",
          display: "flex",
          gap: 5,
          zIndex: 0,
        }}
      >
        {COLUMNS.map((col, i) => (
          <ParallaxColumn
            key={i}
            images={col.images}
            dir={col.dir}
            duration={col.duration}
            skewDeg={SKEWS[i]}
          />
        ))}
      </div>

      {/* ── VIGNETTE / OVERLAY ───────────────────────────────────────────── */}
      {/* Radial vignette darkens edges, central area stays visible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 55% 70% at 50% 50%,
              rgba(18,20,20,0.15) 0%,
              rgba(18,20,20,0.55) 55%,
              rgba(18,20,20,0.92) 100%
            )
          `,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      {/* Central red glow behind logo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 40% 35% at 50% 50%, ${RED}22 0%, transparent 65%)`,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── TOP NAVIGATION ───────────────────────────────────────────────── */}
      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 44px",
          height: 64,
          background: "rgba(18,20,20,0.35)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 20,
            fontWeight: 900,
            color: RED,
            letterSpacing: "0.2em",
            textShadow: `0 0 14px ${RED}88`,
            userSelect: "none",
          }}
        >
          MACU
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              className="macu-nav-link"
              onMouseEnter={() => setNavHover(link)}
              onMouseLeave={() => setNavHover(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: navHover === link ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.42)",
                transition: "color 0.15s",
                textTransform: "uppercase" as const,
              }}
            >
              {link}
            </button>
          ))}
        </div>

        {/* Right action */}
        <a
          href={DOWNLOAD_URL}
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
            textDecoration: "none",
            letterSpacing: "0.1em",
            padding: "7px 18px",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 2,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#f9f5f8";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.14)";
          }}
        >
          ⬇ GET APP
        </a>
      </nav>

      {/* ── HERO CENTER ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          pointerEvents: "none",
        }}
      >
        {/* MACU wordmark */}
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: "clamp(72px, 12vw, 160px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "0.06em",
            lineHeight: 1,
            animation: "glow-pulse 3s ease-in-out infinite",
            userSelect: "none",
            textTransform: "uppercase" as const,
            marginBottom: "clamp(28px, 4vh, 52px)",
          }}
        >
          MACU
        </h1>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: 16,
            pointerEvents: "auto",
          }}
        >
          {/* GET APP — solid red */}
          <a
            href={DOWNLOAD_URL}
            className="macu-btn-get"
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: RED,
              border: "none",
              borderRadius: 3,
              padding: "14px 38px",
              textDecoration: "none",
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              animation: "btn-glow 2.5s ease-in-out infinite",
              transition: "transform 0.18s, box-shadow 0.18s",
              display: "inline-block",
            }}
          >
            GET APP
          </a>

          {/* LAUNCH — ghost / outlined */}
          <button
            onClick={onLaunch}
            className="macu-btn-launch"
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: 3,
              padding: "14px 38px",
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              transition: "transform 0.18s, background 0.18s",
            }}
          >
            LAUNCH
          </button>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 44px",
          height: 48,
          background: "rgba(18,20,20,0.5)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#00ff88",
              animation: "status-blink 2s ease-in-out infinite",
            }}
          />
          SYSTEM ACTIVE
        </div>

        {/* Legal links */}
        <div
          style={{
            display: "flex",
            gap: 24,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.12em",
          }}
        >
          {["PRIVACY", "TERMS", "SECURITY"].map((l) => (
            <button
              key={l}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.25)",
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)")}
            >
              {l}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
