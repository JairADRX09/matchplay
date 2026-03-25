pub mod cards;
pub mod config;
pub mod handlers;
pub mod hub;
pub mod middleware;

use axum::{routing::get, Router};

pub fn build_router(state: handlers::ws::AppState) -> Router {
    Router::new()
        .route("/health", get(handlers::health::health_handler))
        .route("/ws", get(handlers::ws::ws_handler))
        .with_state(state)
}

/// Serves the application on the given listener. Panics on server error.
pub async fn serve(listener: tokio::net::TcpListener, state: handlers::ws::AppState) {
    axum::serve(listener, build_router(state))
        .await
        .expect("server error");
}

/// Starts an embedded server on `127.0.0.1:{port}` with hardcoded defaults.
/// Designed to be called from the Tauri desktop shell.
pub async fn start_embedded(port: u16) {
    use cards::{store::run_reaper, CardStore};
    use handlers::ws::AppState;
    use hub::Hub;

    let hub = Hub::new();
    let store = CardStore::new();

    let reaper_hub = hub.clone();
    let reaper_store = store.clone();
    tokio::spawn(run_reaper(
        reaper_store,
        300,  // card_ttl_secs
        15,   // reaper_interval_secs
        move |evicted| {
            for card_id in evicted {
                reaper_hub.broadcast_card_removed(&card_id);
            }
        },
    ));

    let state = AppState {
        hub,
        store,
        rate_limit_cards_per_min: 2,
        rate_limit_joins_per_min: 5,
    };

    let addr: std::net::SocketAddr = format!("127.0.0.1:{}", port).parse().unwrap();
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind embedded server");
    serve(listener, state).await;
}
