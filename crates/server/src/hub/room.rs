use std::collections::HashMap;

use protocol::{GameMode, GameTag, ServerMessage};

use super::connection::ConnectionHandle;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct RoomKey {
    pub game: GameTag,
    pub mode: GameMode,
}

pub struct Room {
    connections: HashMap<String, ConnectionHandle>,
}

impl Room {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
        }
    }

    pub fn add(&mut self, conn_id: String, handle: ConnectionHandle) {
        self.connections.insert(conn_id, handle);
    }

    pub fn remove(&mut self, conn_id: &str) {
        self.connections.remove(conn_id);
    }

    pub fn broadcast(&self, msg: &ServerMessage) {
        for handle in self.connections.values() {
            let _ = handle.send(msg.clone());
        }
    }

    pub fn is_empty(&self) -> bool {
        self.connections.is_empty()
    }
}

impl Default for Room {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_room_broadcast_reaches_subscribers() {
        let mut room = Room::new();
        let (tx1, mut rx1) = mpsc::unbounded_channel::<ServerMessage>();
        let (tx2, mut rx2) = mpsc::unbounded_channel::<ServerMessage>();

        room.add("conn-1".to_string(), tx1);
        room.add("conn-2".to_string(), tx2);

        room.broadcast(&ServerMessage::CardRemoved {
            card_id: "card-1".to_string(),
        });

        let msg1 = rx1.try_recv().unwrap();
        let msg2 = rx2.try_recv().unwrap();
        assert!(matches!(msg1, ServerMessage::CardRemoved { .. }));
        assert!(matches!(msg2, ServerMessage::CardRemoved { .. }));
    }

    #[tokio::test]
    async fn test_room_remove_stops_broadcast() {
        let mut room = Room::new();
        let (tx1, mut rx1) = mpsc::unbounded_channel::<ServerMessage>();
        room.add("conn-1".to_string(), tx1);
        room.remove("conn-1");

        room.broadcast(&ServerMessage::CardRemoved {
            card_id: "card-1".to_string(),
        });

        assert!(rx1.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_room_is_empty_after_remove() {
        let mut room = Room::new();
        let (tx1, _rx1) = mpsc::unbounded_channel::<ServerMessage>();
        room.add("conn-1".to_string(), tx1);
        assert!(!room.is_empty());
        room.remove("conn-1");
        assert!(room.is_empty());
    }
}
