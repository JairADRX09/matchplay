/**
 * auth-store.ts — Ghost session + OAuth login state.
 * Persists identity to localStorage (primary) + cookies (fallback).
 * OAuth (Google/Discord) wired to Supabase in a future iteration.
 */
import { create } from "zustand";

// ── Persistence helpers ─────────────────────────────────────────────

function setCookie(name: string, value: string, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|;)\\s*" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function persist(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* quota exceeded */ }
  setCookie(key, val);
}
function retrieve(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch { /* private mode */ }
  return getCookie(key);
}

// ── Keys ────────────────────────────────────────────────────────────
const K_ID      = "macu_ghost_id";
const K_TAG     = "macu_ghost_tag";
const K_WELCOME = "macu_seen_welcome";

// ── Generators ──────────────────────────────────────────────────────
function makeGhostTag(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Ghost#${n}`;
}
function makeGhostId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Store ────────────────────────────────────────────────────────────
export interface AuthState {
  /** Ghost session ID (UUID stored in localStorage/cookie) */
  ghostId: string | null;
  /** Display tag shown in UI, e.g. "Ghost#4821" */
  ghostTag: string | null;
  /** First-visit welcome modal */
  showWelcome: boolean;
  /** Login panel (opened from header icon) */
  showLogin: boolean;
  /** Inline "coming soon" message in the login modal */
  oauthMessage: string | null;

  init: () => void;
  continueAsGhost: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  signInGoogle: () => void;
  signInDiscord: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ghostId: null,
  ghostTag: null,
  showWelcome: false,
  showLogin: false,
  oauthMessage: null,

  init: () => {
    const id  = retrieve(K_ID);
    const tag = retrieve(K_TAG);
    if (id && tag) {
      // Returning ghost — restore silently
      set({ ghostId: id, ghostTag: tag });
    } else {
      // First visit (or cleared storage)
      const seen = retrieve(K_WELCOME);
      const previewTag = makeGhostTag(); // pre-generate so modal can show it
      set({ showWelcome: !seen, ghostTag: previewTag });
      if (seen) {
        // Seen welcome but no ghost ID — auto-assign (cleared localStorage)
        get().continueAsGhost();
      }
    }
  },

  continueAsGhost: () => {
    let { ghostId, ghostTag } = get();
    if (!ghostId) {
      ghostId = makeGhostId();
      if (!ghostTag) ghostTag = makeGhostTag();
      persist(K_ID,  ghostId);
      persist(K_TAG, ghostTag);
    }
    persist(K_WELCOME, "1");
    set({ ghostId, ghostTag, showWelcome: false, showLogin: false, oauthMessage: null });
  },

  openLogin:  () => set({ showLogin: true, oauthMessage: null }),
  closeLogin: () => set({ showLogin: false, oauthMessage: null }),

  signInGoogle: () => {
    // TODO: supabase.auth.signInWithOAuth({ provider: 'google' })
    set({ oauthMessage: "Google OAuth — próximamente disponible" });
  },

  signInDiscord: () => {
    // TODO: supabase.auth.signInWithOAuth({ provider: 'discord' })
    set({ oauthMessage: "Discord OAuth — próximamente disponible" });
  },
}));
