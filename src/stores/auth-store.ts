/**
 * auth-store.ts — Ghost session + Supabase OAuth (Google / Discord).
 *
 * Dos modos coexisten:
 *   Ghost       → ID y tag propios, guardados en localStorage + cookies.
 *   Autenticado → sesión de Supabase (Google o Discord OAuth).
 *
 * Migración al hacer login:
 *   Los game-tags del ghost ya están en localStorage (mismo navegador),
 *   así que el usuario autenticado los hereda automáticamente — sin llamadas
 *   extra al backend.
 */
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { usePulseStore } from "./pulse-store";

// ── Persistence helpers (ghost session) ────────────────────────────
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
  try { localStorage.setItem(key, val); } catch { /* quota */ }
  setCookie(key, val);
}
function retrieve(key: string): string | null {
  try { const v = localStorage.getItem(key); if (v !== null) return v; } catch { /* private */ }
  return getCookie(key);
}

// ── Keys ────────────────────────────────────────────────────────────
const K_ID      = "macu_ghost_id";
const K_TAG     = "macu_ghost_tag";
const K_WELCOME = "macu_seen_welcome";

// ── Generators ──────────────────────────────────────────────────────
function makeGhostTag(): string {
  return `Ghost#${Math.floor(1000 + Math.random() * 9000)}`;
}
function makeGhostId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Types ────────────────────────────────────────────────────────────
export interface AuthState {
  /** Supabase user — null while in ghost mode. */
  supabaseUser: User | null;
  /** True when signed in via Google or Discord. */
  isAuthenticated: boolean;
  /** Ghost session UUID (localStorage + cookie). */
  ghostId: string | null;
  /** Display tag, e.g. "Ghost#4821". Kept even after auth so fallback is ready on sign-out. */
  ghostTag: string | null;
  /** First-visit welcome modal. */
  showWelcome: boolean;
  /** Login / account modal opened from the header badge. */
  showLogin: boolean;
  /** Error or status message shown inside the modal. */
  oauthMessage: string | null;

  init: () => void;
  continueAsGhost: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  signInGoogle: () => void;
  signInDiscord: () => void;
  signOut: () => Promise<void>;
}

// ── Store ────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  supabaseUser:    null,
  isAuthenticated: false,
  ghostId:         null,
  ghostTag:        null,
  showWelcome:     false,
  showLogin:       false,
  oauthMessage:    null,

  // ── init ────────────────────────────────────────────────────────
  init: () => {
    // 1. Try to restore an existing Supabase OAuth session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Returning authenticated user — skip welcome, close any modals.
        set({
          supabaseUser:    session.user,
          isAuthenticated: true,
          showWelcome:     false,
          showLogin:       false,
          oauthMessage:    null,
          ghostTag: retrieve(K_TAG),
        });
        persist(K_WELCOME, "1");
        // Load game config from Supabase
        usePulseStore.getState().loadUserConfig(session.user.id);
        return;
      }

      // 2. No OAuth session → ghost mode.
      const id  = retrieve(K_ID);
      const tag = retrieve(K_TAG);
      if (id && tag) {
        // Returning ghost.
        set({ ghostId: id, ghostTag: tag });
      } else {
        // First visit (or storage cleared).
        const seen       = retrieve(K_WELCOME);
        const previewTag = makeGhostTag();
        set({ showWelcome: !seen, ghostTag: previewTag });
        if (seen) get().continueAsGhost(); // auto-assign ghost if they skipped welcome
      }
    });

    // 3. React to future auth changes (OAuth callback redirect, sign-out, etc.).
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          supabaseUser:    session.user,
          isAuthenticated: true,
          showWelcome:     false,
          showLogin:       false,
          oauthMessage:    null,
        });
        persist(K_WELCOME, "1");
        // Load game config from Supabase (replaces any localStorage data)
        usePulseStore.getState().loadUserConfig(session.user.id);
      } else {
        // Signed out → limpiar config de juegos y volver al modal de bienvenida.
        usePulseStore.getState().clearUserConfig();
        // Borrar el flag de "ya vi el welcome" para que vuelva a aparecer
        try { localStorage.removeItem(K_WELCOME); } catch { /* ignore */ }
        document.cookie = `${K_WELCOME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        set({
          supabaseUser:    null,
          isAuthenticated: false,
          ghostId:         null,
          ghostTag:        makeGhostTag(),  // tag temporal para previsualización
          showWelcome:     true,
          showLogin:       false,
          oauthMessage:    null,
        });
      }
    });
  },

  // ── Ghost ───────────────────────────────────────────────────────
  continueAsGhost: () => {
    let { ghostId, ghostTag } = get();
    if (!ghostId) {
      ghostId  = makeGhostId();
      if (!ghostTag) ghostTag = makeGhostTag();
      persist(K_ID,  ghostId);
      persist(K_TAG, ghostTag);
    }
    persist(K_WELCOME, "1");
    set({ ghostId, ghostTag, showWelcome: false, showLogin: false, oauthMessage: null });
  },

  // ── Modal controls ───────────────────────────────────────────────
  openLogin:  () => set({ showLogin: true,  oauthMessage: null }),
  closeLogin: () => set({ showLogin: false, oauthMessage: null }),

  // ── OAuth ────────────────────────────────────────────────────────
  signInGoogle: () => {
    set({ oauthMessage: null });
    supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/app" },
      })
      .catch(() => set({ oauthMessage: "Error al conectar con Google. Intenta de nuevo." }));
  },

  signInDiscord: () => {
    set({ oauthMessage: null });
    supabase.auth
      .signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.origin + "/app" },
      })
      .catch(() => set({ oauthMessage: "Error al conectar con Discord. Intenta de nuevo." }));
  },

  // ── Sign-out ─────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    // onAuthStateChange handles reverting to ghost automatically.
  },
}));
