# Documentacion del proyecto

Esta carpeta centraliza la documentacion tecnica de Pulse LFG: como funciona el
sistema, como se despliega y que diagramas explican sus flujos principales.

## Contenido

| Documento | Proposito |
| --- | --- |
| [deployment.md](deployment.md) | Guia de despliegue del frontend en Vercel y backend en Docker. |
| [architecture.md](architecture.md) | Arquitectura por componentes, responsabilidades y rutas principales. |
| [how-it-works.md](how-it-works.md) | Explicacion del flujo de uso y de los mensajes WebSocket. |
| [diagrams.md](diagrams.md) | Diagramas Mermaid de arquitectura, despliegue y matchmaking. |

## Resumen tecnico

Pulse LFG se divide en:

- Frontend web: React, TypeScript, Vite y Zustand.
- Backend realtime: Rust, Axum, Tokio y WebSockets.
- Protocolo: crate Rust `protocol` y espejo TypeScript en `src/types/index.ts`.
- Autenticacion/datos externos: Supabase desde el cliente web.
- Escritorio opcional: Tauri con servidor embebido para uso local.

El backend mantiene estado en memoria: conexiones WebSocket, suscripciones,
tarjetas publicadas y miembros de lobby. Por eso, si se reinicia el contenedor,
las tarjetas y lobbies activos se pierden. Esto es correcto para un servicio LFG
de presencia temporal, pero conviene tenerlo presente para produccion.

