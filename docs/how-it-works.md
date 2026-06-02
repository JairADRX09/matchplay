# Como funciona el programa

## Flujo general

1. El usuario abre el frontend.
2. El hook `useWebSocket` conecta a `VITE_WS_URL` o a `ws://localhost:8080/ws`.
3. Al conectar, el frontend marca el estado como conectado y reenvia la
   suscripcion activa.
4. El usuario selecciona filtros de juego, modo y rango.
5. El backend devuelve tarjetas existentes que coinciden con esos filtros.
6. Un usuario puede publicar una tarjeta LFG.
7. Otros usuarios pueden unirse a la tarjeta.
8. El servidor sincroniza slots, miembros del lobby y eventos de salida.
9. El reaper elimina tarjetas vencidas y avisa a los clientes.

## Publicar tarjeta

Cuando el cliente envia `PublishCard`, el servidor:

1. Revisa rate limit de publicaciones.
2. Valida juego, modo, rango e IDs de juego.
3. Crea una tarjeta con UUID, timestamp, slots y max slots.
4. La guarda en memoria asociada a la conexion host.
5. Hace broadcast de `NewCard` a suscriptores compatibles.

## Suscribirse a filtros

Cuando el cliente envia `Subscribe`, el servidor:

1. Registra la conexion y sus filtros en el hub.
2. Busca tarjetas existentes que coinciden.
3. Envia un snapshot usando mensajes `NewCard`.

## Unirse a una tarjeta

Cuando el cliente envia `JoinCard`, el servidor:

1. Revisa rate limit de joins.
2. Valida que la tarjeta exista y tenga espacio.
3. Agrega al jugador como miembro del lobby.
4. Envia `HandshakeAccepted` al jugador que se unio.
5. Envia `Handshake` al host.
6. Actualiza el conteo de slots con `CardUpdated`.
7. Envia `LobbyUpdated` a todos los miembros con la lista completa.

## Salir o cerrar conexion

Si un usuario envia `LeaveCard`:

1. El servidor lo remueve del lobby.
2. Libera el slot.
3. Envia `CardUpdated`.
4. Envia `LobbyUpdated` a los miembros restantes.

Si se cierra la conexion WebSocket:

1. Si esa conexion era host, sus tarjetas se eliminan.
2. Si era miembro de lobbies, se remueve de ellos.
3. Se actualizan slots y listas de miembros.
4. El servidor emite `Stats` con el numero actualizado de conexiones.

## Reconexion del frontend

`useWebSocket` intenta reconectar con backoff exponencial:

- Inicia en 1 segundo.
- Duplica el tiempo despues de cada cierre.
- Llega hasta 30 segundos maximo.

Al reconectar, el frontend llama `resubscribe()` para recuperar el snapshot de
tarjetas que coinciden con los filtros actuales.

