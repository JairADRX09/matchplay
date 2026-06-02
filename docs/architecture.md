# Arquitectura

## Componentes principales

### Frontend

Ubicacion: `src/`

Responsabilidades:

- Renderizar la experiencia web.
- Manejar autenticacion y configuracion de usuario con Supabase.
- Mantener estado local con Zustand.
- Abrir una conexion WebSocket al backend.
- Publicar tarjetas LFG, aplicar filtros y unirse a lobbies.

Archivos clave:

| Archivo | Funcion |
| --- | --- |
| `src/App.tsx` | Entrada visual principal de la app. |
| `src/pages/WebApp.tsx` | Pantalla principal de la aplicacion web. |
| `src/hooks/useWebSocket.ts` | Conexion, reconexion y manejo de mensajes WS. |
| `src/stores/pulse-store.ts` | Estado de tarjetas, filtros, lobby y errores. |
| `src/lib/supabase.ts` | Cliente Supabase. |
| `src/types/index.ts` | Tipos TypeScript del protocolo. |

### Backend

Ubicacion: `crates/server/`

Responsabilidades:

- Exponer `GET /health`.
- Exponer `GET /ws` para WebSockets.
- Validar mensajes del cliente.
- Aplicar rate limiting por conexion.
- Guardar tarjetas y lobbies en memoria.
- Enviar eventos realtime a los clientes suscritos.
- Limpiar tarjetas vencidas con un reaper periodico.

Archivos clave:

| Archivo | Funcion |
| --- | --- |
| `crates/server/src/main.rs` | Lee variables, arranca servidor y reaper. |
| `crates/server/src/lib.rs` | Construye rutas y servidor embebido Tauri. |
| `crates/server/src/handlers/ws.rs` | Maneja WebSocket y mensajes del cliente. |
| `crates/server/src/cards/store.rs` | Estado en memoria de tarjetas y lobbies. |
| `crates/server/src/hub/hub.rs` | Conexiones, suscripciones y broadcasts. |
| `crates/server/src/middleware/rate_limit.rs` | Limites por minuto. |

### Protocolo compartido

Ubicacion Rust: `crates/protocol/`

Ubicacion TypeScript: `src/types/index.ts`

El protocolo define mensajes discriminados por `type`. El frontend y backend
deben mantenerse sincronizados.

Mensajes cliente -> servidor:

- `PublishCard`
- `Subscribe`
- `JoinCard`
- `DismissCard`
- `LeaveCard`

Mensajes servidor -> cliente:

- `NewCard`
- `CardRemoved`
- `CardUpdated`
- `Handshake`
- `HandshakeAccepted`
- `LobbyUpdated`
- `Stats`
- `Error`

## Estado y persistencia

El backend usa estado en memoria. Esto significa:

- Las tarjetas activas desaparecen al reiniciar el backend.
- Los lobbies activos desaparecen al reiniciar el backend.
- No hay dependencia de base de datos para el matchmaking realtime.
- Supabase se usa desde el frontend para funcionalidades de usuario/datos de la app.

## Rutas del backend

| Ruta | Metodo | Uso |
| --- | --- | --- |
| `/health` | GET | Health check para Docker/proveedor. |
| `/ws` | GET | Conexion WebSocket realtime. |

## Seguridad y limites actuales

- El rate limit se aplica por conexion WebSocket.
- Las tarjetas tienen TTL y se eliminan automaticamente.
- El backend valida payloads antes de publicar o unir usuarios.
- `MAX_CONNECTIONS` esta configurado como variable operativa, pero la aplicacion
  debe revisarse si se requiere enforcement estricto a nivel de aceptacion de WS.

