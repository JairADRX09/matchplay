# Diagramas

Los diagramas usan Mermaid y se pueden visualizar en GitHub, VS Code o cualquier
visor compatible.

## Arquitectura general

```mermaid
flowchart LR
  U["Usuario"] --> F["Frontend React/Vite"]
  F --> S["Supabase"]
  F <--> WS["WebSocket /ws"]
  WS <--> B["Backend Rust Axum"]
  B --> H["Hub de conexiones y suscripciones"]
  B --> C["CardStore en memoria"]
  B --> R["Reaper de tarjetas vencidas"]
  R --> C
  R --> H
```

## Despliegue

```mermaid
flowchart TB
  Repo["Repositorio Git"] --> V["Vercel"]
  Repo --> D["Docker build"]
  V --> Web["Frontend publico HTTPS"]
  D --> Api["Servidor backend Docker"]
  Web -->|wss://api.dominio.com/ws| Proxy["Reverse proxy TLS"]
  Proxy -->|http://container:8080/ws| Api
  Api --> Health["/health"]
```

## Flujo de publicacion

```mermaid
sequenceDiagram
  participant Host as Host frontend
  participant API as Backend WebSocket
  participant Store as CardStore
  participant Others as Clientes suscritos

  Host->>API: PublishCard
  API->>API: Validar payload y rate limit
  API->>Store: Guardar tarjeta
  API->>Others: NewCard
```

## Flujo de unirse a lobby

```mermaid
sequenceDiagram
  participant Joiner as Jugador que se une
  participant API as Backend WebSocket
  participant Store as CardStore
  participant Host as Host
  participant Lobby as Miembros del lobby

  Joiner->>API: JoinCard
  API->>API: Validar tarjeta y rate limit
  API->>Store: Agregar miembro
  API->>Joiner: HandshakeAccepted
  API->>Host: Handshake
  API->>Lobby: LobbyUpdated
  API->>Lobby: CardUpdated
```

## Ciclo de vida de una tarjeta

```mermaid
stateDiagram-v2
  [*] --> Published: PublishCard valido
  Published --> Visible: Broadcast NewCard
  Visible --> Joined: JoinCard valido
  Joined --> Visible: LeaveCard
  Visible --> Removed: DismissCard
  Visible --> Expired: TTL vencido
  Joined --> Removed: Host desconectado
  Removed --> [*]
  Expired --> [*]
```

## Mensajes del protocolo

```mermaid
flowchart LR
  C["Cliente"] -->|PublishCard| B["Backend"]
  C -->|Subscribe| B
  C -->|JoinCard| B
  C -->|DismissCard| B
  C -->|LeaveCard| B
  B -->|NewCard| C
  B -->|CardRemoved| C
  B -->|CardUpdated| C
  B -->|Handshake| C
  B -->|HandshakeAccepted| C
  B -->|LobbyUpdated| C
  B -->|Stats| C
  B -->|Error| C
```

