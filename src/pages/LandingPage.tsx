/**
 * LandingPage — MACU Protocol
 * Dark tactical aesthetic. 7 animated parallelogram columns, centered hero CTA.
 * 100vw × 100vh, overflow hidden, no scroll.
 */
import { useState } from "react";
import mLogo from "../images/M_logo.webp";

// Apex Legends
import apex1 from "../images/paralelograms/apex_legends/4532e619692eb472a007178cf803f885_nobg.webp";
import apex2 from "../images/paralelograms/apex_legends/4c64088ddbf2e6b337c52ad3906154a5_nobg.webp";
import apex3 from "../images/paralelograms/apex_legends/5532a2b09cd08394d549bbd28f55e77b_nobg.webp";
import apex4 from "../images/paralelograms/apex_legends/7984580e7326ea6570d63fdf49779bae_nobg.webp";
import apex5 from "../images/paralelograms/apex_legends/c77685cb5a9934153bf6cd84ac3b9f8f_nobg.webp";
// Fortnite
import fn1 from "../images/paralelograms/fortnite/0206fa0b2cc6bf682e7e950ad063ec39_nobg.webp";
import fn2 from "../images/paralelograms/fortnite/5c4d601d248a9c9b7b72d8e2baca4386_nobg.webp";
import fn3 from "../images/paralelograms/fortnite/d367bb528441ebf53e923777e29e5634_nobg.webp";
import fn4 from "../images/paralelograms/fortnite/efd1c49a88d23c5398a247d2c7fbb5bc_nobg.webp";
// League of Legends
import lol1 from "../images/paralelograms/league_of_legends/280cd44c99a14a4a305bb0f99eba503a_nobg.webp";
import lol2 from "../images/paralelograms/league_of_legends/2eb10b3a117e9395aafdf74d514f0472_nobg.webp";
import lol3 from "../images/paralelograms/league_of_legends/857faa8f8edeb2010f689ca61a6b946b_nobg.webp";
import lol4 from "../images/paralelograms/league_of_legends/a02814e85f888f3322f4ab315e4afb45_nobg.webp";
import lol5 from "../images/paralelograms/league_of_legends/a74d165c58bfa91c925ba626fc7d1f09_nobg.webp";
// Marvel Rivals
import mr1 from "../images/paralelograms/marvel_rivals/06f4a4adc3222656e2df8dbd2a07723d_nobg.webp";
import mr2 from "../images/paralelograms/marvel_rivals/57532045644926fa7b501a8f949e6542_nobg.webp";
import mr3 from "../images/paralelograms/marvel_rivals/b24dbe230dd9181e6d8657ac58dedc75_nobg.webp";
import mr4 from "../images/paralelograms/marvel_rivals/f51f85dcf3cb74311151dba3e2403628_nobg.webp";
import mr5 from "../images/paralelograms/marvel_rivals/f694a5a8ad6782a1a5392a814d566729_nobg.webp";
// Overwatch
import ow1 from "../images/paralelograms/overwatch/0dcfb72b2160c02522b55e715ba57353_nobg.webp";
import ow2 from "../images/paralelograms/overwatch/72556b44292821366d451d05a0672a92_nobg.webp";
import ow3 from "../images/paralelograms/overwatch/7e200d74029cc34dd5e1b8d38bfa4c26_nobg.webp";
import ow4 from "../images/paralelograms/overwatch/a1755afbeac8b59615e0aaede36f1343_nobg.webp";
import ow5 from "../images/paralelograms/overwatch/c8dc688537f791a91a7dda6dea826cc9_nobg.webp";
// Rocket League
import rl1 from "../images/paralelograms/rocket_league/71a51ce78160d0692dcdfdb7d739177d_nobg.webp";
import rl2 from "../images/paralelograms/rocket_league/988f9d16b1971937f1214deb02ae3feb_nobg.webp";
import rl3 from "../images/paralelograms/rocket_league/b9f0a4214ca35b4d510a3c65d5a9cd27_nobg.webp";
import rl4 from "../images/paralelograms/rocket_league/c2d36ceac43ea7ac74ae281ca565f65a_nobg.webp";
// Valorant
import val1 from "../images/paralelograms/valorant/2cb99eeaa1a8fa6e1acbf75805885686_nobg.webp";
import val2 from "../images/paralelograms/valorant/75b528265d4acab1c7d3223489879cea_nobg.webp";
import val3 from "../images/paralelograms/valorant/88b8b1595b64e62ea49a0597a6df5da2_nobg.webp";
import val4 from "../images/paralelograms/valorant/bc453278cb228a97749f0f1c32809d45_nobg.webp";
import val5 from "../images/paralelograms/valorant/f55b17e7db2dfabc74880588796407b9_nobg.webp";

const DOWNLOAD_URL =
  "https://github.com/macu/macu/releases/latest/download/Macu_x64-setup.exe";

const RED    = "#FF4655";
const DARK   = "#121414";
const MONO   = "'JetBrains Mono', monospace";
const DISPLAY = "'Anybody', Impact, sans-serif";

// ── Column image pools (shuffled so each column looks unique) ─────────────────
const ALL = [
  apex1, apex2, apex3, apex4, apex5,
  fn1, fn2, fn3, fn4,
  lol1, lol2, lol3, lol4, lol5,
  mr1, mr2, mr3, mr4, mr5,
  ow1, ow2, ow3, ow4, ow5,
  rl1, rl2, rl3, rl4,
  val1, val2, val3, val4, val5,
];

function makePool(offset: number): string[] {
  const rotated = [...ALL.slice(offset), ...ALL.slice(0, offset)];
  // Exactly 2 copies so -50% lands at the start of copy 2 — seamless loop
  return [...rotated, ...rotated];
}

const COLUMNS: Array<{ images: string[]; dir: "up" | "down"; duration: number }> = [
  { images: makePool(0),  dir: "up",   duration: 117 },
  { images: makePool(5),  dir: "down", duration: 133 },
  { images: makePool(10), dir: "up",   duration: 105 },
  { images: makePool(15), dir: "down", duration: 125 },
  { images: makePool(20), dir: "up",   duration: 112 },
  { images: makePool(25), dir: "down", duration: 137 },
  { images: makePool(28), dir: "up",   duration: 108 },
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
  const GAP    = 18;

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
              background: "#0d0e10",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center bottom",
                // counter-skew the image so it appears straight inside the slanted column
                transform: `skewX(${-skewDeg}deg) scale(1.1)`,
                filter: "brightness(1.1) contrast(1.05)",
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
        <img src={mLogo} alt="MACU" style={{ height: 36, width: "auto", userSelect: "none" }} />

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
