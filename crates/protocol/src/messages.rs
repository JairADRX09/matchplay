use serde::{Deserialize, Serialize};

use crate::card::{Card, CardId, GameMode, GameTag, RankTier};
use crate::identity::{GameID, SubscriptionFilter};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    PublishCard {
        game: GameTag,
        mode: GameMode,
        rank: RankTier,
        game_ids: Vec<GameID>,
        max_slots: u8,
    },
    Subscribe {
        filters: Vec<SubscriptionFilter>,
    },
    JoinCard {
        card_id: CardId,
        game_ids: Vec<GameID>,
    },
    DismissCard {
        card_id: CardId,
    },
    LeaveCard {
        card_id: CardId,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    NewCard {
        card: Card,
    },
    CardRemoved {
        card_id: CardId,
    },
    CardUpdated {
        card: Card,
    },
    Handshake {
        card_id: CardId,
        joiner_ids: Vec<GameID>,
    },
    HandshakeAccepted {
        card_id: CardId,
        host_ids: Vec<GameID>,
    },
    Error {
        code: ErrorCode,
        message: String,
    },
    Stats {
        connected: u32,
    },
    LobbyUpdated {
        card_id: CardId,
        member_ids: Vec<GameID>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ErrorCode {
    RateLimited,
    CardNotFound,
    InvalidPayload,
    ServerFull,
}
