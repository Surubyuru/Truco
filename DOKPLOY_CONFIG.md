# Configuración de Dokploy para Truco Uruguayo

## Configuración Básica

- **Nombre del Proyecto**: truco-uruguayo
- **Tipo**: Docker Compose
- **Archivo Compose**: docker-compose.yml
- **Puerto**: 80 (HTTP), 443 (HTTPS)

## Configuración de Git

- **Repository URL**: https://github.com/tu-usuario/truco.git
- **Branch**: main
- **Auto Deploy**: Habilitado (deploy automático en cada push)

## Variables de Entorno

Configurar en Dokploy → Settings → Environment Variables:

```
NODE_ENV=production
PORT=3000
```

## Configuración de Dominio

### Dominio Principal
- **Host**: truco.tudominio.com
- **HTTPS**: Habilitado
- **Certificate Type**: Let's Encrypt
- **Force HTTPS**: Habilitado

### Subdominios (opcional)
- **API**: api.truco.tudominio.com → server:3000
- **WWW**: www.truco.tudominio.com → Redirect a truco.tudominio.com

## Healthchecks

Dokploy detectará automáticamente los healthchecks definidos en docker-compose.yml:

- **Server**: `http://server:3000/` cada 30s
- **Client**: `http://client:80/` cada 30s

## Recursos

### Límites Recomendados

**Server Container**:
- CPU: 0.5 cores
- Memory: 512MB
- Memory Limit: 1GB

**Client Container**:
- CPU: 0.25 cores
- Memory: 128MB
- Memory Limit: 256MB

## Backup y Persistencia

Actualmente el estado del juego se almacena en memoria. Para persistencia:

1. Agregar volumen para logs:
```yaml
volumes:
  - ./logs:/app/logs
```

2. Para estado persistente, agregar Redis:
```yaml
services:
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
volumes:
  redis-data:
```

## Monitoreo

Dokploy proporciona:
- Métricas de CPU/RAM en tiempo real
- Logs agregados de todos los contenedores
- Alertas por email/webhook (configurar en Settings)

## Comandos Útiles en Dokploy

### Desde la Terminal de Dokploy:

```bash
# Ver logs del servidor
docker-compose logs -f server

# Ver logs del cliente
docker-compose logs -f client

# Reiniciar un servicio específico
docker-compose restart server

# Ver estado de los contenedores
docker-compose ps

# Ejecutar comando en el servidor
docker-compose exec server sh
```

## Troubleshooting

### WebSockets no funcionan
1. Verificar que el proxy está configurado correctamente
2. En Dokploy → Settings → Advanced → Agregar headers:
   ```
   Upgrade: $http_upgrade
   Connection: "upgrade"
   ```

### Errores de build
1. Limpiar cache: Settings → Advanced → Clear Build Cache
2. Reconstruir: Deploy → Force Rebuild

### Contenedor crashea
1. Ver logs: Logs → Filter by container
2. Verificar recursos: Metrics → Container Resources
3. Aumentar límites de memoria si es necesario

## Actualización

### Automática (Recomendado)
1. Push a tu repositorio Git
2. Dokploy detecta el cambio y redespliega automáticamente

### Manual
1. Dokploy → Deploy → Redeploy
2. Seleccionar "Force Rebuild" si cambiaste dependencias

## Rollback

Si algo sale mal:
1. Dokploy → Deployments → Ver historial
2. Seleccionar deployment anterior
3. Click en "Rollback to this version"

## Seguridad

### Recomendaciones:
1. Habilitar HTTPS (Let's Encrypt automático)
2. Configurar firewall en el VPS
3. Usar secrets para datos sensibles
4. Habilitar rate limiting en Dokploy
5. Configurar backups automáticos

### Headers de Seguridad (Nginx):
Dokploy/Traefik agrega automáticamente:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)

## Escalabilidad

Para manejar más usuarios:

1. **Escalar horizontalmente**:
   - Dokploy → Scale → Aumentar réplicas
   - Agregar Redis para estado compartido

2. **Optimizar recursos**:
   - Habilitar compresión gzip (ya configurado en nginx.conf)
   - Usar CDN para assets estáticos
   - Implementar caching

3. **Load Balancing**:
   - Dokploy maneja automáticamente con Traefik
   - Distribuye tráfico entre réplicas

## Costos Estimados

Para un VPS básico:
- **DigitalOcean**: $6-12/mes (1-2GB RAM)
- **Hetzner**: €4-8/mes (2-4GB RAM)
- **Linode**: $5-10/mes (1-2GB RAM)

Dokploy es gratuito y open-source.

## Soporte

- **Documentación Dokploy**: https://docs.dokploy.com
- **Discord Dokploy**: https://discord.gg/dokploy
- **GitHub Issues**: https://github.com/Dokploy/dokploy/issues
