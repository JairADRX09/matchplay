use std::collections::HashSet;

use protocol::{CardId, ServerMessage};
use tokio::sync::mpsc;

use super::room::RoomKey;

pub type ConnectionHandle = mpsc::UnboundedSender<ServerMessage>;

pub struct Connection {
    pub id: String,
    pub sender: mpsc::UnboundedSender<ServerMessage>,
    pub subscriptions: HashSet<RoomKey>,
    pub published_card: Option<CardId>,
}

impl Connection {
    pub fn new(id: String, sender: mpsc::UnboundedSender<ServerMessage>) -> Self {
        Self {
            id,
            sender,
            subscriptions: HashSet::new(),
            published_card: None,
        }
    }

    pub fn handle(&self) -> ConnectionHandle {
        self.sender.clone()
    }
}
