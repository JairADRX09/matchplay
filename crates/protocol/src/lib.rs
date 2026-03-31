pub mod card;
pub mod identity;
pub mod messages;

pub use card::{Card, CardId, GameMode, GameTag, RankTier};
pub use identity::{GameID, SubscriptionFilter};
pub use messages::{ClientMessage, ErrorCode, ServerMessage};

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    fn make_game_id() -> GameID {
        GameID {
            platform: "steam".to_string(),
            username: "player1".to_string(),
        }
    }

    fn make_rank() -> RankTier {
        RankTier {
            label: "Gold".to_string(),
            ordinal: 50,
        }
    }

    #[test]
    fn test_publish_card_roundtrip() {
        let msg = ClientMessage::PublishCard {
            game: "Valorant".to_string(),
            mode: GameMode::Ranked,
            rank: make_rank(),
            game_ids: vec![make_game_id()],
            max_slots: 4,
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "PublishCard");
        let roundtrip: ClientMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ClientMessage::PublishCard { .. }));
    }

    #[test]
    fn test_subscribe_roundtrip() {
        let msg = ClientMessage::Subscribe {
            filters: vec![SubscriptionFilter {
                game: "Valorant".to_string(),
                mode: Some(GameMode::Ranked),
                min_rank: Some(40),
            }],
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "Subscribe");
        let roundtrip: ClientMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ClientMessage::Subscribe { .. }));
    }

    #[test]
    fn test_join_card_roundtrip() {
        let msg = ClientMessage::JoinCard {
            card_id: "card-123".to_string(),
            game_ids: vec![make_game_id()],
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "JoinCard");
        let roundtrip: ClientMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ClientMessage::JoinCard { .. }));
    }

    #[test]
    fn test_dismiss_card_roundtrip() {
        let msg = ClientMessage::DismissCard {
            card_id: "card-123".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "DismissCard");
        let roundtrip: ClientMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ClientMessage::DismissCard { .. }));
    }

    #[test]
    fn test_new_card_roundtrip() {
        let msg = ServerMessage::NewCard {
            card: Card {
                id: "card-1".to_string(),
                game: "Valorant".to_string(),
                mode: GameMode::Ranked,
                rank: make_rank(),
                created_at: 1000,
                slots: 1,
                max_slots: 4,
            },
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "NewCard");
        let roundtrip: ServerMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ServerMessage::NewCard { .. }));
    }

    #[test]
    fn test_card_removed_roundtrip() {
        let msg = ServerMessage::CardRemoved {
            card_id: "card-1".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "CardRemoved");
        let roundtrip: ServerMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ServerMessage::CardRemoved { .. }));
    }

    #[test]
    fn test_handshake_roundtrip() {
        let msg = ServerMessage::Handshake {
            card_id: "card-1".to_string(),
            joiner_ids: vec![make_game_id()],
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "Handshake");
        let roundtrip: ServerMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ServerMessage::Handshake { .. }));
    }

    #[test]
    fn test_handshake_accepted_roundtrip() {
        let msg = ServerMessage::HandshakeAccepted {
            card_id: "card-1".to_string(),
            host_ids: vec![make_game_id()],
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "HandshakeAccepted");
        let roundtrip: ServerMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ServerMessage::HandshakeAccepted { .. }));
    }

    #[test]
    fn test_error_roundtrip() {
        let msg = ServerMessage::Error {
            code: ErrorCode::RateLimited,
            message: "too fast".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        let val: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(val["type"], "Error");
        let roundtrip: ServerMessage = serde_json::from_str(&json).unwrap();
        assert!(matches!(roundtrip, ServerMessage::Error { .. }));
    }
}
