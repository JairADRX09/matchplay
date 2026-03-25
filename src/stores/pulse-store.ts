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
  ids: GameID[];
  kind: "host" | "joiner";
  game: GameTag;
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

  // Handshake modal
  handshake: HandshakeState | null;

  // WS connection
  connected: boolean;

  // Navigation
  view: AppView;

  // User profile
  userGames: GameTag[];
  userGameIds: Record<GameTag, GameID>; // gameTag → user's GameID

  // Actions
  addCard: (card: Card) => void;
  removeCard: (cardId: CardId) => void;
  setConnected: (v: boolean) => void;
  setHandshake: (hs: HandshakeState) => void;
  clearHandshake: () => void;
  setView: (v: AppView) => void;
  toggleGameFilter: (game: GameTag) => void;
  setModeFilter: (mode: "All" | GameMode) => void;
  setMinRank: (ordinal: number | null) => void;
  setUserConfig: (games: GameTag[], gameIds: Record<GameTag, GameID>) => void;
  publishCard: (game: GameTag, mode: GameMode, rank: RankTier) => void;
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
  view: "setup",
  userGames: [],
  userGameIds: {},

  addCard: (card) => {
    set((s) => {
      if (s.cards.some((c) => c.id === card.id)) return s;

      let { myCardId, pendingPublish } = s;

      // Detect our own card by matching the pending publish
      if (
        pendingPublish &&
        card.game === pendingPublish.game &&
        card.mode === pendingPublish.mode &&
        card.rank.ordinal === pendingPublish.rankOrdinal
      ) {
        myCardId = card.id;
        pendingPublish = null;
      }

      return { cards: [card, ...s.cards], myCardId, pendingPublish };
    });
  },

  removeCard: (cardId) =>
    set((s) => ({
      cards: s.cards.filter((c) => c.id !== cardId),
      myCardId: s.myCardId === cardId ? null : s.myCardId,
    })),

  setConnected: (connected) => set({ connected }),

  setHandshake: (handshake) => set({ handshake }),

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

  publishCard: (game, mode, rank) => {
    const { userGameIds } = get();
    const gameId = userGameIds[game];
    if (!gameId) {
      set({ publishError: "Configure your Game ID in Settings first" });
      return;
    }
    set({ pendingPublish: { game, mode, rankOrdinal: rank.ordinal }, publishError: null });
    wsSend({ type: "PublishCard", game, mode, rank, game_ids: [gameId] });
  },

  joinCard: (cardId, gameTag) => {
    const { userGameIds } = get();
    const gameId = userGameIds[gameTag];
    if (!gameId) return;
    wsSend({ type: "JoinCard", card_id: cardId, game_ids: [gameId] });
  },

  dismissCard: (cardId) => {
    set({ myCardId: null, pendingPublish: null });
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
