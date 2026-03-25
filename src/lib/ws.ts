/**
 * Module-level singleton for the WebSocket send function.
 * The store's actions call `wsSend()` directly without holding a WS reference.
 * `useWebSocket` sets this after each successful connect.
 */
import type { ClientMessage } from "../types";

let _send: ((msg: ClientMessage) => void) | null = null;

export function setWsSend(fn: ((msg: ClientMessage) => void) | null): void {
  _send = fn;
}

export function wsSend(msg: ClientMessage): void {
  _send?.(msg);
}

export function isWsReady(): boolean {
  return _send !== null;
}
