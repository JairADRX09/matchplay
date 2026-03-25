use protocol::{CardId, GameID, GameMode, RankTier};
use thiserror::Error;

use crate::cards::store::CardStore;

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error("GameTag too long or contains invalid characters")]
    InvalidGameTag,
    #[error("RankTier label too long")]
    InvalidRankLabel,
    #[error("RankTier ordinal out of range (0-100)")]
    InvalidRankOrdinal,
    #[error("Too many GameIDs (max 5)")]
    TooManyGameIds,
    #[error("GameID username too long (max 60 chars)")]
    UsernameTooLong,
    #[error("Card not found")]
    CardNotFound,
}

pub fn validate_publish(
    game: &str,
    _mode: &GameMode,
    rank: &RankTier,
    game_ids: &[GameID],
) -> Result<(), ValidationError> {
    if game.is_empty() || game.len() > 50 || !game.chars().all(|c| c.is_alphanumeric() || c == '-') {
        return Err(ValidationError::InvalidGameTag);
    }
    if rank.label.is_empty() || rank.label.len() > 30 {
        return Err(ValidationError::InvalidRankLabel);
    }
    if rank.ordinal > 100 {
        return Err(ValidationError::InvalidRankOrdinal);
    }
    if game_ids.len() > 5 {
        return Err(ValidationError::TooManyGameIds);
    }
    for gid in game_ids {
        if gid.username.len() > 60 {
            return Err(ValidationError::UsernameTooLong);
        }
    }
    Ok(())
}

pub fn validate_join(card_id: &CardId, store: &CardStore) -> Result<(), ValidationError> {
    if store.get(card_id).is_none() {
        return Err(ValidationError::CardNotFound);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use protocol::{GameMode, RankTier};

    fn valid_rank() -> RankTier {
        RankTier { label: "Gold".to_string(), ordinal: 50 }
    }

    fn valid_game_id() -> GameID {
        GameID { platform: "steam".to_string(), username: "player1".to_string() }
    }

    #[test]
    fn test_valid_publish() {
        assert!(validate_publish("Valorant", &GameMode::Ranked, &valid_rank(), &[valid_game_id()]).is_ok());
    }

    #[test]
    fn test_invalid_game_tag_too_long() {
        let long_tag = "a".repeat(51);
        assert!(validate_publish(&long_tag, &GameMode::Ranked, &valid_rank(), &[]).is_err());
    }

    #[test]
    fn test_invalid_game_tag_special_chars() {
        assert!(validate_publish("Valo rant", &GameMode::Ranked, &valid_rank(), &[]).is_err());
    }

    #[test]
    fn test_invalid_rank_ordinal() {
        let rank = RankTier { label: "X".to_string(), ordinal: 101 };
        assert!(validate_publish("Valorant", &GameMode::Ranked, &rank, &[]).is_err());
    }

    #[test]
    fn test_too_many_game_ids() {
        let ids: Vec<GameID> = (0..6).map(|_| valid_game_id()).collect();
        assert!(validate_publish("Valorant", &GameMode::Ranked, &valid_rank(), &ids).is_err());
    }

    #[test]
    fn test_username_too_long() {
        let id = GameID { platform: "steam".to_string(), username: "a".repeat(61) };
        assert!(validate_publish("Valorant", &GameMode::Ranked, &valid_rank(), &[id]).is_err());
    }

    #[test]
    fn test_validate_join_card_not_found() {
        let store = CardStore::new();
        assert!(validate_join(&"nonexistent".to_string(), &store).is_err());
    }
}
