export const CARD_TTL_SECS = 300;

/** Seconds elapsed since unix timestamp */
export function elapsedSecs(createdAt: number): number {
  return Math.floor(Date.now() / 1000) - createdAt;
}

/** Human-readable elapsed string */
export function elapsed(createdAt: number): string {
  const s = elapsedSecs(createdAt);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

/** 0–1 fraction of TTL remaining (1 = fresh, 0 = expired) */
export function ttlPercent(createdAt: number): number {
  return Math.max(0, 1 - elapsedSecs(createdAt) / CARD_TTL_SECS);
}

/** Color for TTL bar based on remaining fraction */
export function ttlColor(pct: number): string {
  if (pct > 0.5) return "#00ffa3";
  if (pct > 0.25) return "#ffaa2e";
  return "#ff4d6a";
}

/** Current unix timestamp in seconds */
export function nowSecs(): number {
  return Math.floor(Date.now() / 1000);
}
