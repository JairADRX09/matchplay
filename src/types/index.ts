// ── Mirror of crates/protocol ─────────────────────────────────────────────────
// All types must stay in sync with the Rust protocol crate.

export type CardId = string;
export type GameTag = string;
export type GameMode = "Casual" | "Ranked";

export interface RankTier {
  label: string;
  ordinal: number;
}

export interface GameID {
  platform: string;
  username: string;
}

export interface Card {
  id: CardId;
  game: GameTag;
  mode: GameMode;
  rank: RankTier;
  created_at: number; // unix seconds
}

export interface SubscriptionFilter {
  game: GameTag;
  mode: GameMode | null;
  min_rank: number | null;
}

export type ErrorCode =
  | "RateLimited"
  | "CardNotFound"
  | "InvalidPayload"
  | "ServerFull";

// ── ClientMessage — discriminated union matching serde(tag = "type") ──────────

export type ClientMessage =
  | {
      type: "PublishCard";
      game: GameTag;
      mode: GameMode;
      rank: RankTier;
      game_ids: GameID[];
    }
  | { type: "Subscribe"; filters: SubscriptionFilter[] }
  | { type: "JoinCard"; card_id: CardId; game_ids: GameID[] }
  | { type: "DismissCard"; card_id: CardId };

// ── ServerMessage — discriminated union matching serde(tag = "type") ──────────

export type ServerMessage =
  | { type: "NewCard"; card: Card }
  | { type: "CardRemoved"; card_id: CardId }
  | { type: "Handshake"; card_id: CardId; joiner_ids: GameID[] }
  | { type: "HandshakeAccepted"; card_id: CardId; host_ids: GameID[] }
  | { type: "Error"; code: ErrorCode; message: string };
