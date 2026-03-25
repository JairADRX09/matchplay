pub struct Config {
    pub server_host: String,
    pub server_port: u16,
    pub card_ttl_secs: u64,
    pub reaper_interval_secs: u64,
    pub rate_limit_cards_per_min: u32,
    pub rate_limit_joins_per_min: u32,
    pub max_connections: usize,
    pub log_level: String,
}

fn require_var(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("Missing env var: {}", name))
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            server_host: require_var("SERVER_HOST"),
            server_port: require_var("SERVER_PORT")
                .parse()
                .unwrap_or_else(|_| panic!("Invalid SERVER_PORT: must be a valid port number")),
            card_ttl_secs: require_var("CARD_TTL_SECS")
                .parse()
                .unwrap_or_else(|_| panic!("Invalid CARD_TTL_SECS: must be a positive integer")),
            reaper_interval_secs: require_var("REAPER_INTERVAL_SECS")
                .parse()
                .unwrap_or_else(|_| panic!("Invalid REAPER_INTERVAL_SECS: must be a positive integer")),
            rate_limit_cards_per_min: require_var("RATE_LIMIT_CARDS_PER_MIN")
                .parse()
                .unwrap_or_else(|_| panic!("Invalid RATE_LIMIT_CARDS_PER_MIN: must be a positive integer")),
            rate_limit_joins_per_min: require_var("RATE_LIMIT_JOINS_PER_MIN")
                .parse()
                .unwrap_or_else(|_| panic!("Invalid RATE_LIMIT_JOINS_PER_MIN: must be a positive integer")),
            max_connections: require_var("MAX_CONNECTIONS")
                .parse()
                .unwrap_or_else(|_| panic!("Invalid MAX_CONNECTIONS: must be a positive integer")),
            log_level: require_var("LOG_LEVEL"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set_all_vars() {
        std::env::set_var("SERVER_HOST", "127.0.0.1");
        std::env::set_var("SERVER_PORT", "8080");
        std::env::set_var("CARD_TTL_SECS", "300");
        std::env::set_var("REAPER_INTERVAL_SECS", "15");
        std::env::set_var("RATE_LIMIT_CARDS_PER_MIN", "2");
        std::env::set_var("RATE_LIMIT_JOINS_PER_MIN", "5");
        std::env::set_var("MAX_CONNECTIONS", "10000");
        std::env::set_var("LOG_LEVEL", "info");
    }

    #[test]
    #[should_panic(expected = "Missing env var: PULSE_NONEXISTENT_TEST_VAR")]
    fn test_missing_var_panics() {
        // PULSE_NONEXISTENT_TEST_VAR is guaranteed not to exist in any real environment
        require_var("PULSE_NONEXISTENT_TEST_VAR");
    }

    #[test]
    fn test_config_parses_all_vars() {
        set_all_vars();
        let cfg = Config::from_env();
        assert_eq!(cfg.server_host, "127.0.0.1");
        assert_eq!(cfg.server_port, 8080);
        assert_eq!(cfg.card_ttl_secs, 300);
        assert_eq!(cfg.reaper_interval_secs, 15);
        assert_eq!(cfg.rate_limit_cards_per_min, 2);
        assert_eq!(cfg.rate_limit_joins_per_min, 5);
        assert_eq!(cfg.max_connections, 10000);
        assert_eq!(cfg.log_level, "info");
    }
}
