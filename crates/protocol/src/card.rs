use serde::{Deserialize, Serialize};

pub type CardId = String;
pub type GameTag = String;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum GameMode {
    Casual,
    Ranked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RankTier {
    pub label: String,
    pub ordinal: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Card {
    pub id: CardId,
    pub game: GameTag,
    pub mode: GameMode,
    pub rank: RankTier,
    pub created_at: u64,
    pub slots: u8,      // current players (starts at 1 for host)
    pub max_slots: u8,  // maximum players
}
