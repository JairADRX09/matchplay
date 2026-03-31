import { useEffect, useRef } from "react";
import { setWsSend } from "../lib/ws";
import { usePulseStore } from "../stores/pulse-store";
import type { ServerMessage } from "../types";

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
        case "CardUpdated":
          store.updateCard(msg.card);
          break;
        case "Handshake": {
          // Host is notified a new player joined.
          // Do NOT mutate ids here — LobbyUpdated will deliver the authoritative full list.
          // Just ensure the lobby room overlay is open.
          const existingHandshake = store.handshake;
          if (!existingHandshake || existingHandshake.cardId !== msg.card_id) {
            const card = store.cards.find((c) => c.id === msg.card_id);
            store.setHandshake({
              cardId: msg.card_id,
              ids: [], // LobbyUpdated will fill this immediately after
              kind: "host",
              game: card?.game ?? "",
              createdAt: card?.created_at ?? Math.floor(Date.now() / 1000),
            });
          }
          // LobbyUpdated (sent right after by server) will sync the full member list
          break;
        }
        case "HandshakeAccepted": {
          // Joiner is accepted — open the lobby room.
          // host_ids has IDs of members before this join; LobbyUpdated will deliver the full list.
          const card = store.cards.find((c) => c.id === msg.card_id);
          const game = card?.game ?? "";
          store.setHandshake({
            cardId: msg.card_id,
            ids: msg.host_ids, // partial — LobbyUpdated will overwrite with complete list
            kind: "joiner",
            game,
            createdAt: card?.created_at ?? Math.floor(Date.now() / 1000),
          });
          break;
        }
        case "LobbyUpdated":
          // Server sends full member list after any join/leave event
          store.syncLobbyIds(msg.card_id, msg.member_ids);
          break;
        case "Stats":
          store.setConnectedCount(msg.connected);
          break;
        case "Error":
          if (msg.code === "RateLimited") {
            store.clearPublishError();
            usePulseStore.setState({
              publishError: "Rate limited — wait a moment",
              pendingPublish: null,
              handshake: null,
            });
          }
          console.warn("[Macu]", msg.code, msg.message);
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
