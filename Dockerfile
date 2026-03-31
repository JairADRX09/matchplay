# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM rust:1.80-slim-bookworm AS builder
WORKDIR /app

# Install system deps + lld linker (much faster than default ld for Rust)
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev lld clang && \
    rm -rf /var/lib/apt/lists/*

# Use lld linker — cuts link time from ~3 min to ~20 s on free-tier CPUs
ENV RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=lld"

# Copy workspace manifests — minimal workspace (no Tauri, no tests)
COPY Cargo.lock ./
COPY Cargo.toml ./Cargo.toml.orig
COPY crates/protocol/Cargo.toml ./crates/protocol/Cargo.toml
COPY crates/server/Cargo.toml    ./crates/server/Cargo.toml

# Create a minimal workspace that only needs the backend crates
RUN printf '[workspace]\nmembers = ["crates/protocol", "crates/server"]\nresolver = "2"\n\n[profile.release]\nopt-level = 1\nlto = false\ncodegen-units = 16\nstrip = true\n' > Cargo.toml

# Cache dependencies with dummy source files
RUN mkdir -p crates/protocol/src crates/server/src
RUN echo 'pub fn _dummy() {}' > crates/protocol/src/lib.rs
RUN echo 'pub fn _dummy() {}' > crates/server/src/lib.rs
RUN echo 'fn main() {}'       > crates/server/src/main.rs
RUN cargo build --release --bin pulse-server 2>/dev/null; exit 0

# Copy real source and rebuild (only changed files recompile)
COPY crates/ ./crates/
RUN touch crates/protocol/src/lib.rs crates/server/src/lib.rs crates/server/src/main.rs
RUN cargo build --release --bin pulse-server

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/pulse-server /usr/local/bin/pulse-server

EXPOSE 8080

CMD ["/bin/sh", "-c", \
  "SERVER_HOST=0.0.0.0 \
   SERVER_PORT=${PORT:-8080} \
   CARD_TTL_SECS=${CARD_TTL_SECS:-60} \
   REAPER_INTERVAL_SECS=${REAPER_INTERVAL_SECS:-5} \
   RATE_LIMIT_CARDS_PER_MIN=${RATE_LIMIT_CARDS_PER_MIN:-2} \
   RATE_LIMIT_JOINS_PER_MIN=${RATE_LIMIT_JOINS_PER_MIN:-5} \
   MAX_CONNECTIONS=${MAX_CONNECTIONS:-500} \
   LOG_LEVEL=${LOG_LEVEL:-info} \
   pulse-server"]
