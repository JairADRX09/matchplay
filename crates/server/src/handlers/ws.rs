use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    extract::{ws::Message, State, WebSocketUpgrade},
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use protocol::{Card, ClientMessage, ErrorCode, ServerMessage};
use tokio::sync::mpsc;
use tracing::{debug, info, warn};
use uuid::Uuid;

use crate::{
    cards::{
        store::CardStore,
        validation::{validate_join, validate_publish},
    },
    hub::Hub,
    middleware::rate_limit::RateLimiter,
};

#[derive(Clone)]
pub struct AppState {
    pub hub: Hub,
    pub store: CardStore,
    pub rate_limit_cards_per_min: u32,
    pub rate_limit_joins_per_min: u32,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: axum::extract::ws::WebSocket, state: AppState) {
    let conn_id = Uuid::new_v4().to_string();
    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

    state.hub.register_connection(conn_id.clone(), tx.clone());
    state.hub.broadcast_stats();
    info!(conn_id = %conn_id, "WebSocket connected");

    let (mut ws_sender, mut ws_receiver) = socket.split();
    let mut publish_limiter = RateLimiter::new(state.rate_limit_cards_per_min);
    let mut join_limiter = RateLimiter::new(state.rate_limit_joins_per_min);

    loop {
        tokio::select! {
            msg = ws_receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        debug!(conn_id = %conn_id, "← text");
                        handle_client_message(
                            &text,
                            &conn_id,
                            &tx,
                            &state,
                            &mut publish_limiter,
                            &mut join_limiter,
                        );
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    _ => {}
                }
            }
            outbound = rx.recv() => {
                match outbound {
                    Some(msg) => {
                        match serde_json::to_string(&msg) {
                            Ok(text) => {
                                if ws_sender.send(Message::Text(text)).await.is_err() {
                                    break;
                                }
                            }
                            Err(e) => warn!("Serialize error: {}", e),
                        }
                    }
                    None => break,
                }
            }
        }
    }

    // Cleanup: remove published cards and broadcast their removal
    for card_id in state.store.get_by_connection(&conn_id) {
        state.store.remove(&card_id);
        state.hub.broadcast_card_removed(&card_id);
    }
    state.hub.unsubscribe(&conn_id);
    state.hub.unregister_connection(&conn_id);
    state.hub.broadcast_stats();
    info!(conn_id = %conn_id, "WebSocket disconnected");
}

fn handle_client_message(
    text: &str,
    conn_id: &str,
    tx: &mpsc::UnboundedSender<ServerMessage>,
    state: &AppState,
    publish_limiter: &mut RateLimiter,
    join_limiter: &mut RateLimiter,
) {
    let msg: ClientMessage = match serde_json::from_str(text) {
        Ok(m) => m,
        Err(_) => {
            let _ = tx.send(ServerMessage::Error {
                code: ErrorCode::InvalidPayload,
                message: "Invalid message format".to_string(),
            });
            return;
        }
    };

    match msg {
        ClientMessage::PublishCard { game, mode, rank, game_ids, max_slots } => {
            if !publish_limiter.try_consume() {
                warn!(conn_id = %conn_id, "Rate limited: PublishCard");
                let _ = tx.send(ServerMessage::Error {
                    code: ErrorCode::RateLimited,
                    message: "Too many cards published".to_string(),
                });
                return;
            }
            match validate_publish(&game, &mode, &rank, &game_ids) {
                Err(e) => {
                    warn!(conn_id = %conn_id, "Validation: {}", e);
                    let _ = tx.send(ServerMessage::Error {
                        code: ErrorCode::InvalidPayload,
                        message: e.to_string(),
                    });
                }
                Ok(()) => {
                    let card = Card {
                        id: Uuid::new_v4().to_string(),
                        game,
                        mode,
                        rank,
                        created_at: SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                        slots: 1,
                        max_slots: max_slots.clamp(2, 10),
                    };
                    let card_id = card.id.clone();
                    state.store.insert(card.clone(), conn_id.to_string(), game_ids);
                    state.hub.broadcast_new_card(&card);
                    info!(conn_id = %conn_id, card_id = %card_id, "Card published");
                }
            }
        }

        ClientMessage::Subscribe { filters } => {
            state.hub.subscribe(conn_id, tx.clone(), &filters);
            debug!(conn_id = %conn_id, filters = filters.len(), "Subscribed");
        }

        ClientMessage::JoinCard { card_id, game_ids } => {
            if !join_limiter.try_consume() {
                warn!(conn_id = %conn_id, "Rate limited: JoinCard");
                let _ = tx.send(ServerMessage::Error {
                    code: ErrorCode::RateLimited,
                    message: "Too many join attempts".to_string(),
                });
                return;
            }
            match validate_join(&card_id, &state.store) {
                Err(_) => {
                    let _ = tx.send(ServerMessage::Error {
                        code: ErrorCode::CardNotFound,
                        message: "Card not found".to_string(),
                    });
                }
                Ok(()) => {
                    match state.store.add_member(&card_id, conn_id.to_string(), game_ids.clone()) {
                        None => {
                            let _ = tx.send(ServerMessage::Error {
                                code: ErrorCode::CardNotFound,
                                message: "Lobby is full or not found".to_string(),
                            });
                        }
                        Some((updated_card, existing_ids, host_conn_id)) => {
                            // Send HandshakeAccepted to joiner with all existing member IDs
                            let _ = tx.send(ServerMessage::HandshakeAccepted {
                                card_id: card_id.clone(),
                                host_ids: existing_ids,
                            });
                            // Notify host about new joiner
                            if let Some(host_tx) = state.hub.get_connection(&host_conn_id) {
                                let _ = host_tx.send(ServerMessage::Handshake {
                                    card_id: card_id.clone(),
                                    joiner_ids: game_ids,
                                });
                            }
                            // Broadcast updated slot count to all subscribers
                            state.hub.broadcast_card_updated(&updated_card);
                            info!(conn_id = %conn_id, "Joined lobby {}", card_id);
                        }
                    }
                }
            }
        }

        ClientMessage::DismissCard { card_id } => {
            if state.store.remove(&card_id).is_some() {
                state.hub.broadcast_card_removed(&card_id);
                info!(conn_id = %conn_id, card_id = %card_id, "Card dismissed");
            }
        }
    }
}
