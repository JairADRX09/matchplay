import { create } from "zustand";
import type {
  Card,
  CardId,
  GameID,
  GameMode,
  GameTag,
  RankTier,
  SubscriptionFilter,
} from "../types";
import { wsSend } from "../lib/ws";

export type AppView = "setup" | "feed" | "settings";

export interface HandshakeState {
  cardId: CardId;
  ids: GameID[];       // all other players' IDs in the lobby
  kind: "host" | "joiner";
  game: GameTag;
  createdAt: number;   // unix seconds of the card (for countdown)
}

interface PendingPublish {
  game: GameTag;
  mode: GameMode;
  rankOrdinal: number;
}

interface PulseState {
  // Feed
  cards: Card[];
  myCardId: CardId | null;
  pendingPublish: PendingPublish | null;
  publishError: string | null;

  // Filters (what we ask the server to send us)
  selectedGames: GameTag[];
  modeFilter: "All" | GameMode;
  minRankOrdinal: number | null;

  // Handshake / Lobby modal
  handshake: HandshakeState | null;

  // WS connection
  connected: boolean;
  connectedCount: number;

  // Navigation
  view: AppView;

  // User profile
  userGames: GameTag[];
  userGameIds: Record<GameTag, GameID>; // gameTag → user's GameID

  // Actions
  addCard: (card: Card) => void;
  removeCard: (cardId: CardId) => void;
  updateCard: (card: Card) => void;
  setConnected: (v: boolean) => void;
  setConnectedCount: (n: number) => void;
  setHandshake: (hs: HandshakeState) => void;
  appendHandshakeIds: (ids: GameID[]) => void;
  syncLobbyIds: (cardId: CardId, ids: GameID[]) => void;
  clearHandshake: () => void;
  setView: (v: AppView) => void;
  toggleGameFilter: (game: GameTag) => void;
  setModeFilter: (mode: "All" | GameMode) => void;
  setMinRank: (ordinal: number | null) => void;
  setUserConfig: (games: GameTag[], gameIds: Record<GameTag, GameID>) => void;
  publishCard: (game: GameTag, mode: GameMode, rank: RankTier, maxSlots?: number) => void;
  joinCard: (cardId: CardId, gameTag: GameTag) => void;
  dismissCard: (cardId: CardId) => void;
  resubscribe: () => void;
  clearPublishError: () => void;
}

function buildFilters(
  games: GameTag[],
  mode: "All" | GameMode,
): SubscriptionFilter[] {
  return games.map((game) => ({
    game,
    mode: mode === "All" ? null : mode,
    min_rank: null,
  }));
}

export const usePulseStore = create<PulseState>((set, get) => ({
  cards: [],
  myCardId: null,
  pendingPublish: null,
  publishError: null,
  selectedGames: [],
  modeFilter: "All",
  minRankOrdinal: null,
  handshake: null,
  connected: false,
  connectedCount: 0,
  view: "setup",
  userGames: [],
  userGameIds: {},

  addCard: (card) => {
    set((s) => {
      if (s.cards.some((c) => c.id === card.id)) return s;

      let { myCardId, pendingPublish, handshake } = s;

      // Detect our own card by matching the pending publish
      if (
        pendingPublish &&
        card.game === pendingPublish.game &&
        card.mode === pendingPublish.mode &&
        card.rank.ordinal === pendingPublish.rankOrdinal
      ) {
        myCardId = card.id;
        pendingPublish = null;
        // Open lobby room only after server confirms the card
        const ownGameId = s.userGameIds[card.game];
        handshake = {
          cardId: card.id,
          ids: ownGameId ? [ownGameId] : [],
          kind: "host",
          game: card.game,
          createdAt: card.created_at,
        };
      }

      return { cards: [card, ...s.cards], myCardId, pendingPublish, handshake };
    });
  },

  removeCard: (cardId) =>
    set((s) => ({
      cards: s.cards.filter((c) => c.id !== cardId),
      myCardId: s.myCardId === cardId ? null : s.myCardId,
      // Close lobby if the card we're in got removed
      handshake:
        s.handshake?.cardId === cardId ? null : s.handshake,
    })),

  updateCard: (card) =>
    set((s) => ({
      cards: s.cards.map((c) => (c.id === card.id ? card : c)),
    })),

  setConnected: (connected) => set({ connected }),

  setConnectedCount: (connectedCount) => set({ connectedCount }),

  setHandshake: (handshake) => set({ handshake }),

  appendHandshakeIds: (ids) =>
    set((s) => {
      if (!s.handshake) return s;
      return {
        handshake: {
          ...s.handshake,
          ids: [...s.handshake.ids, ...ids],
        },
      };
    }),

  syncLobbyIds: (cardId, ids) =>
    set((s) => {
      if (!s.handshake || s.handshake.cardId !== cardId) return s;
      return { handshake: { ...s.handshake, ids } };
    }),

  clearHandshake: () => set({ handshake: null }),

  setView: (view) => set({ view }),

  toggleGameFilter: (game) => {
    const { selectedGames, modeFilter } = get();
    const next = selectedGames.includes(game)
      ? selectedGames.filter((g) => g !== game)
      : [...selectedGames, game];
    set({ selectedGames: next });
    wsSend({ type: "Subscribe", filters: buildFilters(next, modeFilter) });
  },

  setModeFilter: (mode) => {
    const { selectedGames } = get();
    set({ modeFilter: mode });
    wsSend({ type: "Subscribe", filters: buildFilters(selectedGames, mode) });
  },

  setMinRank: (ordinal) => set({ minRankOrdinal: ordinal }),

  setUserConfig: (games, gameIds) => {
    set({
      userGames: games,
      userGameIds: gameIds,
      selectedGames: games,
      view: "feed",
    });
    const { modeFilter } = get();
    wsSend({ type: "Subscribe", filters: buildFilters(games, modeFilter) });
  },

  publishCard: (game, mode, rank, maxSlots = 4) => {
    const { userGameIds, connected } = get();
    if (!connected) {
      set({ publishError: "Sin conexión al servidor" });
      return;
    }
    const gameId = userGameIds[game];
    if (!gameId) {
      set({ publishError: "Configura tu Game ID en Ajustes primero" });
      return;
    }
    // pendingPublish is set here; handshake opens only after server confirms via addCard
    set({ pendingPublish: { game, mode, rankOrdinal: rank.ordinal }, publishError: null });
    wsSend({ type: "PublishCard", game, mode, rank, game_ids: [gameId], max_slots: maxSlots });
  },

  joinCard: (cardId, gameTag) => {
    const { userGameIds } = get();
    const gameId = userGameIds[gameTag];
    if (!gameId) return;
    wsSend({ type: "JoinCard", card_id: cardId, game_ids: [gameId] });
  },

  dismissCard: (cardId) => {
    set({ myCardId: null, pendingPublish: null, handshake: null });
    wsSend({ type: "DismissCard", card_id: cardId });
  },

  resubscribe: () => {
    const { selectedGames, modeFilter } = get();
    if (selectedGames.length > 0) {
      wsSend({ type: "Subscribe", filters: buildFilters(selectedGames, modeFilter) });
    }
  },

  clearPublishError: () => set({ publishError: null }),
}));
