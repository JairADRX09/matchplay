# MACU

MACU es una aplicacion para encontrar equipo en juegos competitivos. El
frontend esta construido con React, TypeScript y Vite. El backend es un servidor
Rust con Axum que expone un WebSocket para publicar tarjetas de busqueda,
suscribirse a filtros y coordinar lobbies en tiempo real.

## Estructura del proyecto

```text
.
|-- src/                 # Frontend React/Vite
|-- crates/protocol/     # Tipos y mensajes compartidos del protocolo Rust
|-- crates/server/       # Backend Axum/WebSocket
|-- src-tauri/           # Shell de escritorio Tauri
|-- tests/               # Pruebas de integracion Rust
|-- Dockerfile           # Imagen Docker del backend
|-- vercel.json          # Configuracion del frontend en Vercel
|-- render.yaml          # Ejemplo de despliegue Docker en Render
|-- railway.toml         # Ejemplo de despliegue Docker en Railway
|-- docs/                # Documentacion tecnica y diagramas
```

## Desarrollo local

Instala dependencias del frontend:

```bash
npm install
```

Levanta el frontend:

```bash
npm run dev
```

Levanta el backend Rust con variables locales:

```bash
SERVER_HOST=127.0.0.1 \
SERVER_PORT=8080 \
CARD_TTL_SECS=60 \
REAPER_INTERVAL_SECS=5 \
RATE_LIMIT_CARDS_PER_MIN=2 \
RATE_LIMIT_JOINS_PER_MIN=5 \
MAX_CONNECTIONS=500 \
LOG_LEVEL=info \
cargo run -p server --bin pulse-server
```

En Windows PowerShell:

```powershell
$env:SERVER_HOST="127.0.0.1"
$env:SERVER_PORT="8080"
$env:CARD_TTL_SECS="60"
$env:REAPER_INTERVAL_SECS="5"
$env:RATE_LIMIT_CARDS_PER_MIN="2"
$env:RATE_LIMIT_JOINS_PER_MIN="5"
$env:MAX_CONNECTIONS="500"
$env:LOG_LEVEL="info"
cargo run -p server --bin pulse-server
```

El frontend se conecta por defecto a `ws://localhost:8080/ws`. Para cambiarlo,
configura `VITE_WS_URL`.

## Variables de entorno

Frontend:

| Variable | Descripcion |
| --- | --- |
| `VITE_WS_URL` | URL WebSocket publica del backend, por ejemplo `wss://api.midominio.com/ws`. |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Llave anon/public de Supabase. |

Backend:

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `SERVER_HOST` | Host donde escucha el servidor. En Docker debe ser `0.0.0.0`. | `0.0.0.0` |
| `SERVER_PORT` | Puerto interno del servidor. | `8080` |
| `CARD_TTL_SECS` | Tiempo de vida de una tarjeta publicada. | `60` |
| `REAPER_INTERVAL_SECS` | Intervalo para limpiar tarjetas vencidas. | `5` |
| `RATE_LIMIT_CARDS_PER_MIN` | Publicaciones permitidas por conexion/minuto. | `2` |
| `RATE_LIMIT_JOINS_PER_MIN` | Intentos de unirse permitidos por conexion/minuto. | `5` |
| `MAX_CONNECTIONS` | Limite operativo documentado para conexiones concurrentes. | `500` |
| `LOG_LEVEL` | Nivel de logs para `tracing`. | `info` |

## Despliegue rapido

Frontend en Vercel:

1. Importa este repositorio en Vercel.
2. Usa framework `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Agrega `VITE_WS_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
6. Despliega.

Backend en servidor con Docker:

```bash
docker build -t macu-api .
docker run -d \
  --name macu-api \
  -p 8080:8080 \
  -e CARD_TTL_SECS=60 \
  -e REAPER_INTERVAL_SECS=5 \
  -e RATE_LIMIT_CARDS_PER_MIN=2 \
  -e RATE_LIMIT_JOINS_PER_MIN=5 \
  -e MAX_CONNECTIONS=500 \
  -e LOG_LEVEL=info \
  macu-api
```

Despues apunta `VITE_WS_URL` a `wss://tu-dominio/ws` si el servidor esta detras
de HTTPS, o a `ws://tu-ip:8080/ws` solo para pruebas sin TLS.

## Documentacion

La documentacion completa esta en [docs/README.md](docs/README.md):

- [docs/deployment.md](docs/deployment.md): despliegue frontend y backend.
- [docs/architecture.md](docs/architecture.md): componentes y responsabilidades.
- [docs/how-it-works.md](docs/how-it-works.md): flujo funcional del programa.
- [docs/diagrams.md](docs/diagrams.md): diagramas Mermaid.

