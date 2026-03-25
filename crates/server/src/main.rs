use std::net::SocketAddr;

use tracing::info;
use tracing_subscriber::EnvFilter;

use server::{
    cards::{store::run_reaper, CardStore},
    config::Config,
    handlers::ws::AppState,
    hub::Hub,
};

/// Loads key=value pairs from a `.env` file into the process environment.
/// Skips blank lines and comments. Does not override already-set vars.
fn load_dotenv() {
    let Ok(content) = std::fs::read_to_string(".env") else {
        return;
    };
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((key, val)) = line.split_once('=') {
            let key = key.trim();
            let val = val.trim();
            if std::env::var(key).is_err() {
                // Safety: single-threaded before tokio runtime starts
                #[allow(deprecated)]
                std::env::set_var(key, val);
            }
        }
    }
}

#[tokio::main]
async fn main() {
    load_dotenv();

    let config = Config::from_env();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new(&config.log_level))
        .init();

    let hub = Hub::new();
    let store = CardStore::new();

    // Spawn reaper — evicts expired cards and broadcasts CardRemoved.
    let reaper_hub = hub.clone();
    let reaper_store = store.clone();
    tokio::spawn(run_reaper(
        reaper_store,
        config.card_ttl_secs,
        config.reaper_interval_secs,
        move |evicted| {
            for card_id in evicted {
                reaper_hub.broadcast_card_removed(&card_id);
            }
        },
    ));

    let state = AppState {
        hub,
        store,
        rate_limit_cards_per_min: config.rate_limit_cards_per_min,
        rate_limit_joins_per_min: config.rate_limit_joins_per_min,
    };

    let addr: SocketAddr = format!("{}:{}", config.server_host, config.server_port)
        .parse()
        .unwrap_or_else(|_| {
            panic!("Invalid address: {}:{}", config.server_host, config.server_port)
        });

    info!("Pulse server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|e| panic!("Failed to bind {}: {}", addr, e));

    server::serve(listener, state).await;
}
