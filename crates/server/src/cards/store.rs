use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

use protocol::{Card, CardId, GameID};

#[derive(Debug, Clone)]
pub struct StoredCard {
    pub card: Card,
    pub host_conn_id: String,
    pub host_game_ids: Vec<GameID>,
}

#[derive(Clone)]
pub struct CardStore {
    inner: Arc<RwLock<HashMap<CardId, StoredCard>>>,
}

impl CardStore {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn insert(&self, card: Card, conn_id: String, game_ids: Vec<GameID>) {
        let stored = StoredCard {
            card,
            host_conn_id: conn_id,
            host_game_ids: game_ids,
        };
        self.inner.write().unwrap().insert(stored.card.id.clone(), stored);
    }

    pub fn get(&self, card_id: &str) -> Option<StoredCard> {
        self.inner.read().unwrap().get(card_id).cloned()
    }

    pub fn remove(&self, card_id: &str) -> Option<StoredCard> {
        self.inner.write().unwrap().remove(card_id)
    }

    pub fn get_by_connection(&self, conn_id: &str) -> Vec<CardId> {
        self.inner
            .read()
            .unwrap()
            .values()
            .filter(|s| s.host_conn_id == conn_id)
            .map(|s| s.card.id.clone())
            .collect()
    }

    /// Removes all expired cards and returns their IDs.
    pub fn reap(&self, ttl_secs: u64) -> Vec<CardId> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut store = self.inner.write().unwrap();
        let expired: Vec<CardId> = store
            .iter()
            .filter(|(_, s)| now.saturating_sub(s.card.created_at) > ttl_secs)
            .map(|(id, _)| id.clone())
            .collect();

        for id in &expired {
            store.remove(id);
        }
        expired
    }
}

impl Default for CardStore {
    fn default() -> Self {
        Self::new()
    }
}

pub async fn run_reaper(
    store: CardStore,
    ttl_secs: u64,
    interval_secs: u64,
    on_evict: impl Fn(Vec<CardId>) + Send + 'static,
) {
    let mut interval =
        tokio::time::interval(std::time::Duration::from_secs(interval_secs));
    loop {
        interval.tick().await;
        let evicted = store.reap(ttl_secs);
        if !evicted.is_empty() {
            on_evict(evicted);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use protocol::{GameMode, RankTier};

    fn make_card(id: &str, created_at: u64) -> Card {
        Card {
            id: id.to_string(),
            game: "Valorant".to_string(),
            mode: GameMode::Ranked,
            rank: RankTier { label: "Gold".to_string(), ordinal: 50 },
            created_at,
        }
    }

    fn make_game_id() -> GameID {
        GameID {
            platform: "steam".to_string(),
            username: "player1".to_string(),
        }
    }

    #[test]
    fn test_insert_and_get() {
        let store = CardStore::new();
        let card = make_card("card-1", 1000);
        store.insert(card.clone(), "conn-1".to_string(), vec![make_game_id()]);

        let retrieved = store.get("card-1").unwrap();
        assert_eq!(retrieved.card.id, "card-1");
        assert_eq!(retrieved.host_conn_id, "conn-1");
    }

    #[test]
    fn test_remove() {
        let store = CardStore::new();
        let card = make_card("card-1", 1000);
        store.insert(card, "conn-1".to_string(), vec![make_game_id()]);
        let removed = store.remove("card-1");
        assert!(removed.is_some());
        assert!(store.get("card-1").is_none());
    }

    #[test]
    fn test_get_by_connection() {
        let store = CardStore::new();
        store.insert(make_card("card-1", 1000), "conn-1".to_string(), vec![]);
        store.insert(make_card("card-2", 1000), "conn-2".to_string(), vec![]);
        store.insert(make_card("card-3", 1000), "conn-1".to_string(), vec![]);

        let conn1_cards = store.get_by_connection("conn-1");
        assert_eq!(conn1_cards.len(), 2);
        assert!(conn1_cards.contains(&"card-1".to_string()));
        assert!(conn1_cards.contains(&"card-3".to_string()));
    }

    #[test]
    fn test_reaper_removes_expired() {
        let store = CardStore::new();
        // Card created 1000 seconds ago
        let old_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .saturating_sub(1000);
        store.insert(make_card("card-old", old_ts), "conn-1".to_string(), vec![]);

        // Card created just now
        let now_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        store.insert(make_card("card-new", now_ts), "conn-2".to_string(), vec![]);

        let evicted = store.reap(300);
        assert!(evicted.contains(&"card-old".to_string()));
        assert!(!evicted.contains(&"card-new".to_string()));
        assert!(store.get("card-old").is_none());
        assert!(store.get("card-new").is_some());
    }
}
