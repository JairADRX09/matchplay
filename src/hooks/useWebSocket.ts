import { useEffect, useRef } from "react";
import { setWsSend } from "../lib/ws";
import { usePulseStore } from "../stores/pulse-store";
import type { ServerMessage } from "../types";
import { getGame } from "../data/games";

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:8080/ws";
const MAX_BACKOFF_MS = 30_000;

export function useWebSocket(): void {
  const backoffRef = useRef(1_000);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const wsRef = useRef<WebSocket | null>(null);
  const unmountedRef = useRef(false);

  const connect = (): void => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) { ws.close(); return; }
      backoffRef.current = 1_000;
      setWsSend((msg) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      });
      usePulseStore.getState().setConnected(true);
      usePulseStore.getState().resubscribe();
    };

    ws.onmessage = (ev: MessageEvent<string>) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(ev.data) as ServerMessage;
      } catch {
        return;
      }

      const store = usePulseStore.getState();
      switch (msg.type) {
        case "NewCard":
          store.addCard(msg.card);
          break;
        case "CardRemoved":
          store.removeCard(msg.card_id);
          break;
        case "Handshake":
          store.setHandshake({
            cardId: msg.card_id,
            ids: msg.joiner_ids,
            kind: "host",
            game: store.myCardId
              ? (store.cards.find((c) => c.id === msg.card_id)?.game ?? "")
              : "",
          });
          break;
        case "HandshakeAccepted": {
          const card = store.cards.find((c) => c.id === msg.card_id);
          store.setHandshake({
            cardId: msg.card_id,
            ids: msg.host_ids,
            kind: "joiner",
            game: card?.game ?? "",
          });
          break;
        }
        case "Error":
          if (msg.code === "RateLimited") {
            store.clearPublishError(); // reset pending
            usePulseStore.setState({ publishError: "Rate limited — wait a moment", pendingPublish: null });
          }
          console.warn("[Pulse]", msg.code, msg.message);
          break;
      }
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      setWsSend(null);
      usePulseStore.getState().setConnected(false);
      reconnectRef.current = setTimeout(() => {
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        connect();
      }, backoffRef.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  };

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      clearTimeout(reconnectRef.current);
      setWsSend(null);
      wsRef.current?.close();
      usePulseStore.getState().setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Re-export to avoid unused import warning in useWebSocket.ts
export { getGame as _getGame };
