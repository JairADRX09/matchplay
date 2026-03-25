use std::net::SocketAddr;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use protocol::{ClientMessage, ErrorCode, GameID, GameMode, RankTier, ServerMessage, SubscriptionFilter};
use server::{cards::CardStore, handlers::ws::AppState, hub::Hub};
use tokio::net::TcpListener;
use tokio_tungstenite::{connect_async, tungstenite, MaybeTlsStream, WebSocketStream};

type WsStream = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;

// ── helpers ─────────────────────────────────────────────────────────────────

async fn start_server(cards_per_min: u32, joins_per_min: u32) -> SocketAddr {
    let hub = Hub::new();
    let store = CardStore::new();
    let state = AppState {
        hub,
        store,
        rate_limit_cards_per_min: cards_per_min,
        rate_limit_joins_per_min: joins_per_min,
    };
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(server::serve(listener, state));
    addr
}

async fn connect(addr: SocketAddr) -> WsStream {
    let url = format!("ws://{}/ws", addr);
    let (stream, _) = connect_async(&url).await.expect("WS connect failed");
    stream
}

async fn send(ws: &mut WsStream, msg: ClientMessage) {
    let text = serde_json::to_string(&msg).unwrap();
    ws.send(tungstenite::Message::Text(text)).await.unwrap();
}

/// Waits up to `ms` milliseconds for the next text ServerMessage.
async fn recv(ws: &mut WsStream, ms: u64) -> Option<ServerMessage> {
    let timeout = tokio::time::timeout(Duration::from_millis(ms), ws.next());
    match timeout.await {
        Ok(Some(Ok(tungstenite::Message::Text(t)))) => serde_json::from_str(&t).ok(),
        _ => None,
    }
}

fn game_id(platform: &str, username: &str) -> GameID {
    GameID { platform: platform.to_string(), username: username.to_string() }
}

fn sub(game: &str, mode: GameMode) -> ClientMessage {
    ClientMessage::Subscribe {
        filters: vec![SubscriptionFilter {
            game: game.to_string(),
            mode: Some(mode),
            min_rank: None,
        }],
    }
}

fn publish_valorant(game_ids: Vec<GameID>) -> ClientMessage {
    ClientMessage::PublishCard {
        game: "Valorant".to_string(),
        mode: GameMode::Ranked,
        rank: RankTier { label: "Gold".to_string(), ordinal: 50 },
        game_ids,
    }
}

// ── main flow test ───────────────────────────────────────────────────────────

#[tokio::test]
async fn test_full_ws_flow() {
    let addr = start_server(2, 5).await;

    let mut client_a = connect(addr).await;
    let mut client_b = connect(addr).await;
    let mut client_c = connect(addr).await;

    // Step 3-5: subscriptions
    send(&mut client_a, sub("Valorant", GameMode::Ranked)).await;
    send(&mut client_b, sub("Valorant", GameMode::Ranked)).await;
    send(&mut client_c, sub("LeagueOfLegends", GameMode::Ranked)).await;

    // Brief pause so all subscriptions are registered before the publish
    tokio::time::sleep(Duration::from_millis(30)).await;

    // Step 6: A publishes Valorant Ranked Gold
    let host_ids = vec![game_id("riot", "PlayerA#1234")];
    send(&mut client_a, publish_valorant(host_ids.clone())).await;

    // Step 7a: A receives its own NewCard (A is subscribed to the same room)
    let a_new = recv(&mut client_a, 1_000).await;
    let card_id = match a_new {
        Some(ServerMessage::NewCard { card }) => card.id,
        other => panic!("Expected A to receive NewCard, got {:?}", other),
    };

    // Step 7b: B receives NewCard
    let b_new = recv(&mut client_b, 1_000).await;
    assert!(
        matches!(b_new, Some(ServerMessage::NewCard { ref card }) if card.id == card_id),
        "Expected B to receive NewCard {{ id: {card_id} }}, got {:?}",
        b_new
    );

    // Step 7c: C must NOT receive anything
    let c_nothing = recv(&mut client_c, 100).await;
    assert!(
        c_nothing.is_none(),
        "C should not receive NewCard, got {:?}",
        c_nothing
    );

    // Step 8: B sends JoinCard
    let joiner_ids = vec![game_id("riot", "PlayerB#5678")];
    send(
        &mut client_b,
        ClientMessage::JoinCard { card_id: card_id.clone(), game_ids: joiner_ids.clone() },
    )
    .await;

    // Step 9a: A receives Handshake with B's IDs
    let a_handshake = recv(&mut client_a, 1_000).await;
    match a_handshake {
        Some(ServerMessage::Handshake { card_id: cid, joiner_ids: ids }) => {
            assert_eq!(cid, card_id);
            assert_eq!(ids[0].username, "PlayerB#5678");
        }
        other => panic!("Expected Handshake for A, got {:?}", other),
    }

    // Step 9b: B receives HandshakeAccepted with A's IDs
    let b_accepted = recv(&mut client_b, 1_000).await;
    match b_accepted {
        Some(ServerMessage::HandshakeAccepted { card_id: cid, host_ids: ids }) => {
            assert_eq!(cid, card_id);
            assert_eq!(ids[0].username, "PlayerA#1234");
        }
        other => panic!("Expected HandshakeAccepted for B, got {:?}", other),
    }

    // Step 10: A dismisses the card
    send(&mut client_a, ClientMessage::DismissCard { card_id: card_id.clone() }).await;

    // Step 11: B receives CardRemoved
    let b_removed = recv(&mut client_b, 1_000).await;
    assert!(
        matches!(b_removed, Some(ServerMessage::CardRemoved { card_id: ref cid }) if cid == &card_id),
        "Expected B to receive CardRemoved, got {:?}",
        b_removed
    );
}

// ── rate limiting test ───────────────────────────────────────────────────────

#[tokio::test]
async fn test_rate_limit_publish() {
    // cards_per_min=2 so the third publish in quick succession is rejected
    let addr = start_server(2, 5).await;
    let mut client = connect(addr).await;

    // Not subscribed — only errors will arrive directly

    // Publish 1 & 2: succeed (no message back since not subscribed to the room)
    send(&mut client, publish_valorant(vec![game_id("steam", "x")])).await;
    send(&mut client, publish_valorant(vec![game_id("steam", "x")])).await;

    // Publish 3: should be rate-limited
    send(&mut client, publish_valorant(vec![game_id("steam", "x")])).await;

    let resp = recv(&mut client, 1_000).await;
    match resp {
        Some(ServerMessage::Error { code: ErrorCode::RateLimited, .. }) => {}
        other => panic!("Expected RateLimited error, got {:?}", other),
    }
}

// ── malformed payload test ───────────────────────────────────────────────────

#[tokio::test]
async fn test_invalid_payload() {
    let addr = start_server(2, 5).await;
    let mut client = connect(addr).await;

    client
        .send(tungstenite::Message::Text("{\"type\":\"NotARealMessage\"}".to_string()))
        .await
        .unwrap();

    let resp = recv(&mut client, 1_000).await;
    assert!(
        matches!(resp, Some(ServerMessage::Error { code: ErrorCode::InvalidPayload, .. })),
        "Expected InvalidPayload error, got {:?}",
        resp
    );
}
