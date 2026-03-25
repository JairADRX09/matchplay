use serde::{Deserialize, Serialize};

use crate::card::{GameMode, GameTag};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameID {
    pub platform: String,
    pub username: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionFilter {
    pub game: GameTag,
    pub mode: Option<GameMode>,
    pub min_rank: Option<u16>,
}
