# Despliegue

Esta guia cubre dos piezas separadas:

- Frontend en Vercel.
- Backend en un servidor propio con Docker.

## 1. Backend Docker

El backend esta en `crates/server` y el `Dockerfile` de la raiz compila solo los
crates necesarios para producir el binario `pulse-server`.

### Build local

```bash
docker build -t macu-api .
```

### Ejecutar localmente

```bash
docker run --rm \
  -p 8080:8080 \
  -e CARD_TTL_SECS=60 \
  -e REAPER_INTERVAL_SECS=5 \
  -e RATE_LIMIT_CARDS_PER_MIN=2 \
  -e RATE_LIMIT_JOINS_PER_MIN=5 \
  -e MAX_CONNECTIONS=500 \
  -e LOG_LEVEL=info \
  macu-api
```

El `Dockerfile` asigna automaticamente:

- `SERVER_HOST=0.0.0.0`
- `SERVER_PORT=${PORT:-8080}`

Por eso muchos proveedores pueden inyectar `PORT` y el contenedor lo respeta.

### Health check

El backend expone:

```text
GET /health
```

El WebSocket principal esta en:

```text
GET /ws
```

Prueba rapida:

```bash
curl http://localhost:8080/health
```

### Docker Compose recomendado

Crea un archivo `docker-compose.yml` en el servidor si quieres operarlo con
reinicio automatico:

```yaml
services:
  pulse-api:
    image: macu-api
    build: .
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      CARD_TTL_SECS: "60"
      REAPER_INTERVAL_SECS: "5"
      RATE_LIMIT_CARDS_PER_MIN: "2"
      RATE_LIMIT_JOINS_PER_MIN: "5"
      MAX_CONNECTIONS: "500"
      LOG_LEVEL: "info"
```

Comandos:

```bash
docker compose up -d --build
docker compose logs -f pulse-api
```

### Produccion con dominio y TLS

Para que el frontend en Vercel use WebSockets seguros, el backend debe estar
publicado con HTTPS/WSS. Lo normal es poner Nginx, Caddy o Traefik delante del
contenedor.

Ejemplo conceptual con proxy:

```text
Vercel frontend -> wss://api.tudominio.com/ws -> reverse proxy -> container:8080
```

El proxy debe permitir upgrade de WebSocket. En Nginx, las claves importantes
son `proxy_http_version 1.1`, `Upgrade` y `Connection`.

## 2. Frontend en Vercel

El archivo `vercel.json` ya define:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Pasos

1. Entra a Vercel y crea un nuevo proyecto desde el repositorio.
2. Verifica que el framework detectado sea `Vite`.
3. Confirma:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Agrega las variables de entorno:
   - `VITE_WS_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Despliega.

### Variables del frontend

| Variable | Valor esperado |
| --- | --- |
| `VITE_WS_URL` | `wss://api.tudominio.com/ws` |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Llave anon/public de Supabase |

Importante: las variables `VITE_*` se incrustan en el build del frontend. Si
cambias `VITE_WS_URL`, debes redeplegar el frontend.

## 3. Orden recomendado de despliegue

1. Desplegar backend Docker.
2. Verificar `/health`.
3. Configurar dominio y TLS para obtener `wss://.../ws`.
4. Configurar `VITE_WS_URL` en Vercel.
5. Desplegar frontend.
6. Abrir dos navegadores y probar publicar/unirse a una tarjeta.

## 4. Checklist de produccion

- Backend responde en `/health`.
- WebSocket acepta conexiones en `/ws`.
- `VITE_WS_URL` usa `wss://`, no `ws://`, cuando el frontend esta en HTTPS.
- Supabase tiene configuradas las URLs permitidas para el dominio de Vercel.
- El contenedor reinicia automaticamente si falla.
- Logs del backend son visibles.
- El proxy soporta WebSocket upgrade.

