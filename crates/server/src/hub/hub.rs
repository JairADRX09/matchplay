use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use protocol::{Card, GameMode, SubscriptionFilter};

use super::connection::ConnectionHandle;
use super::room::{Room, RoomKey};

#[derive(Clone)]
pub struct Hub {
    rooms: Arc<RwLock<HashMap<RoomKey, Room>>>,
    connections: Arc<RwLock<HashMap<String, ConnectionHandle>>>,
}

impl Hub {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(RwLock::new(HashMap::new())),
            connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn register_connection(&self, conn_id: String, handle: ConnectionHandle) {
        let mut conns = self.connections.write().unwrap();
        conns.insert(conn_id, handle);
    }

    pub fn unregister_connection(&self, conn_id: &str) {
        let mut conns = self.connections.write().unwrap();
        conns.remove(conn_id);
    }

    pub fn subscribe(&self, conn_id: &str, handle: ConnectionHandle, filters: &[SubscriptionFilter]) {
        let mut rooms = self.rooms.write().unwrap();
        for filter in filters {
            let modes = if let Some(m) = &filter.mode {
                vec![m.clone()]
            } else {
                vec![GameMode::Casual, GameMode::Ranked]
            };
            for mode in modes {
                let key = RoomKey {
                    game: filter.game.clone(),
                    mode,
                };
                rooms
                    .entry(key)
                    .or_default()
                    .add(conn_id.to_string(), handle.clone());
            }
        }
    }

    pub fn unsubscribe(&self, conn_id: &str) {
        let mut rooms = self.rooms.write().unwrap();
        rooms.retain(|_, room| {
            room.remove(conn_id);
            !room.is_empty()
        });
    }

    pub fn broadcast_new_card(&self, card: &Card) {
        let rooms = self.rooms.read().unwrap();
        for (key, room) in rooms.iter() {
            if key.game == card.game && key.mode == card.mode {
                room.broadcast(&protocol::ServerMessage::NewCard { card: card.clone() });
            }
        }
    }

    pub fn broadcast_card_removed(&self, card_id: &str) {
        let rooms = self.rooms.read().unwrap();
        for room in rooms.values() {
            room.broadcast(&protocol::ServerMessage::CardRemoved {
                card_id: card_id.to_string(),
            });
        }
    }

    pub fn get_connection(&self, conn_id: &str) -> Option<ConnectionHandle> {
        let conns = self.connections.read().unwrap();
        conns.get(conn_id).cloned()
    }
}

impl Default for Hub {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use protocol::{GameMode, ServerMessage, SubscriptionFilter};
    use tokio::sync::mpsc;

    fn make_handle() -> (ConnectionHandle, tokio::sync::mpsc::UnboundedReceiver<ServerMessage>) {
        mpsc::unbounded_channel()
    }

    #[tokio::test]
    async fn test_subscribe_and_broadcast() {
        let hub = Hub::new();
        let (tx, mut rx) = make_handle();

        hub.register_connection("conn-1".to_string(), tx.clone());
        hub.subscribe(
            "conn-1",
            tx,
            &[SubscriptionFilter {
                game: "Valorant".to_string(),
                mode: Some(GameMode::Ranked),
                min_rank: None,
            }],
        );

        let card = protocol::Card {
            id: "card-1".to_string(),
            game: "Valorant".to_string(),
            mode: GameMode::Ranked,
            rank: protocol::RankTier { label: "Gold".to_string(), ordinal: 50 },
            created_at: 0,
        };
        hub.broadcast_new_card(&card);

        let msg = rx.try_recv().unwrap();
        assert!(matches!(msg, ServerMessage::NewCard { .. }));
    }

    #[tokio::test]
    async fn test_unsubscribe_removes_from_rooms() {
        let hub = Hub::new();
        let (tx, mut rx) = make_handle();

        hub.register_connection("conn-1".to_string(), tx.clone());
        hub.subscribe(
            "conn-1",
            tx,
            &[SubscriptionFilter {
                game: "Valorant".to_string(),
                mode: Some(GameMode::Ranked),
                min_rank: None,
            }],
        );
        hub.unsubscribe("conn-1");

        let card = protocol::Card {
            id: "card-1".to_string(),
            game: "Valorant".to_string(),
            mode: GameMode::Ranked,
            rank: protocol::RankTier { label: "Gold".to_string(), ordinal: 50 },
            created_at: 0,
        };
        hub.broadcast_new_card(&card);

        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_empty_rooms_cleaned_up() {
        let hub = Hub::new();
        let (tx, _rx) = make_handle();

        hub.subscribe(
            "conn-1",
            tx,
            &[SubscriptionFilter {
                game: "Valorant".to_string(),
                mode: Some(GameMode::Ranked),
                min_rank: None,
            }],
        );
        hub.unsubscribe("conn-1");

        let rooms = hub.rooms.read().unwrap();
        assert!(rooms.is_empty());
    }
}
