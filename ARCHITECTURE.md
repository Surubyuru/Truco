# 🏗️ Arquitectura del Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS (443)
                         │
                    ┌────▼─────┐
                    │ Dokploy  │
                    │ (Traefik)│
                    └────┬─────┘
                         │
                         │ HTTP (80)
                         │
        ┌────────────────┴────────────────┐
        │                                  │
   ┌────▼─────┐                      ┌────▼─────┐
   │  Nginx   │                      │  Nginx   │
   │Container │                      │Container │
   │(Client)  │                      │(Client)  │
   └────┬─────┘                      └────┬─────┘
        │                                  │
        │ /socket.io/*                    │ Static Files
        │ /api/*                          │ (React Build)
        │                                  │
   ┌────▼──────────────────────────────────┘
   │
   │ HTTP (3000)
   │
┌──▼──────────┐
│   Node.js   │
│   Express   │
│  Socket.io  │
│  (Server)   │
└─────────────┘
```

## 📦 Contenedores

### 1. **truco-server**
- **Base**: `node:20-alpine`
- **Puerto**: 3000
- **Función**: Servidor de juego con Socket.io
- **Healthcheck**: Verifica endpoint raíz cada 30s

### 2. **truco-client**
- **Base**: `nginx:alpine`
- **Puerto**: 80
- **Función**: Servir cliente React y proxy a servidor
- **Healthcheck**: Verifica nginx cada 30s

## 🔄 Flujo de Datos

1. **Cliente → Nginx**: Petición HTTP/HTTPS
2. **Nginx → Archivos estáticos**: Si es un archivo (HTML, CSS, JS)
3. **Nginx → Servidor**: Si es `/socket.io/*` o `/api/*`
4. **Servidor → Cliente**: Respuesta vía HTTP o WebSocket

## 🌐 Networking

- **Red Docker**: `truco-network` (bridge)
- **Comunicación interna**: Los contenedores se comunican por nombre
- **Puerto expuesto**: Solo el puerto 80 del cliente

## 🔐 Seguridad

- Nginx maneja CORS y headers de seguridad
- Dokploy/Traefik maneja SSL/TLS automáticamente
- Servidor no expuesto directamente a internet
- Healthchecks para detectar fallos

## 📊 Escalabilidad

Para escalar horizontalmente (múltiples instancias):
1. Agregar Redis para estado compartido
2. Configurar Socket.io con Redis adapter
3. Usar load balancer (Dokploy lo maneja)

```javascript
// server/index.js - Para escalar con Redis
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://redis:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```
