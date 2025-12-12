# 🔧 Comandos Útiles para Deployment

## Docker Local

### Construcción y Ejecución

```bash
# Construir y levantar todos los servicios
docker-compose up -d --build

# Levantar servicios sin rebuild
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir solo un servicio
docker-compose build server
docker-compose build client

# Reiniciar un servicio específico
docker-compose restart server
docker-compose restart client
```

### Logs y Debugging

```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f server
docker-compose logs -f client

# Ver últimas 50 líneas
docker-compose logs --tail=50

# Ver logs desde hace 10 minutos
docker-compose logs --since 10m
```

### Inspección de Contenedores

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver recursos utilizados
docker stats

# Ejecutar comando en un contenedor
docker-compose exec server sh
docker-compose exec client sh

# Ver configuración de un servicio
docker-compose config

# Validar docker-compose.yml
docker-compose config --quiet
```

### Limpieza

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune

# Eliminar todo lo no usado
docker system prune

# Limpieza agresiva (cuidado!)
docker system prune -a --volumes
```

## Deployment en VPS

### SSH y Conexión

```bash
# Conectar al VPS
ssh usuario@tu-vps-ip

# Conectar con clave SSH
ssh -i ~/.ssh/id_rsa usuario@tu-vps-ip

# Copiar archivos al VPS
scp docker-compose.yml usuario@tu-vps-ip:/path/to/truco/
scp -r ./client usuario@tu-vps-ip:/path/to/truco/

# Copiar desde VPS a local
scp usuario@tu-vps-ip:/path/to/logs.txt ./
```

### Git en VPS

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/truco.git
cd truco

# Actualizar código
git pull origin main

# Ver cambios
git status
git log -n 5

# Cambiar de rama
git checkout develop
```

### Docker en VPS

```bash
# Deployment completo
cd /path/to/truco
git pull origin main
docker-compose down
docker-compose up -d --build
docker image prune -f

# Ver estado
docker-compose ps
docker-compose logs --tail=50

# Backup antes de actualizar
docker-compose exec server sh -c "tar czf /tmp/backup.tar.gz /app"
docker cp truco-server:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

## Dokploy

### CLI de Dokploy

```bash
# Instalar Dokploy
curl -sSL https://dokploy.com/install.sh | sh

# Actualizar Dokploy
dokploy update

# Ver logs de Dokploy
docker logs -f dokploy

# Reiniciar Dokploy
docker restart dokploy

# Backup de Dokploy
dokploy backup

# Restaurar backup
dokploy restore backup.tar.gz
```

### Desde la UI de Dokploy

1. **Deploy Manual**:
   - Projects → Tu Proyecto → Deploy

2. **Ver Logs**:
   - Projects → Tu Proyecto → Logs

3. **Reiniciar Servicio**:
   - Projects → Tu Proyecto → Services → Restart

4. **Rollback**:
   - Projects → Tu Proyecto → Deployments → Select → Rollback

5. **Variables de Entorno**:
   - Projects → Tu Proyecto → Settings → Environment

## Nginx

### Comandos Útiles

```bash
# Verificar configuración
nginx -t

# Recargar configuración
nginx -s reload

# Detener Nginx
nginx -s stop

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Dentro del contenedor
docker-compose exec client nginx -t
docker-compose exec client nginx -s reload
```

## Monitoreo

### Recursos del Sistema

```bash
# CPU y Memoria
htop
top

# Uso de disco
df -h
du -sh /path/to/truco

# Procesos de Docker
docker stats

# Espacio usado por Docker
docker system df
```

### Logs del Sistema

```bash
# Logs del sistema
journalctl -xe

# Logs de Docker
journalctl -u docker

# Logs de un contenedor específico
docker logs truco-server
docker logs truco-client
```

### Health Checks

```bash
# Verificar servidor
curl http://localhost:3000/

# Verificar cliente
curl http://localhost/

# Verificar WebSocket (con wscat)
npm install -g wscat
wscat -c ws://localhost:3000/socket.io/?transport=websocket

# Health check completo
docker-compose ps
curl -f http://localhost/ || echo "Client failed"
curl -f http://localhost:3000/ || echo "Server failed"
```

## Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Dokploy (solo si necesitas acceso directo)

# Ver reglas
sudo ufw status

# Eliminar regla
sudo ufw delete allow 3000/tcp

# Deshabilitar firewall
sudo ufw disable
```

## SSL/TLS con Let's Encrypt

### Con Dokploy (Automático)
Dokploy maneja SSL automáticamente, solo necesitas:
1. Configurar el dominio en Dokploy
2. Habilitar HTTPS
3. Seleccionar Let's Encrypt

### Manual con Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d truco.tudominio.com

# Renovar certificados
sudo certbot renew

# Test de renovación
sudo certbot renew --dry-run

# Ver certificados
sudo certbot certificates
```

## Backup y Restauración

### Backup Manual

```bash
# Backup completo del proyecto
tar czf truco-backup-$(date +%Y%m%d).tar.gz /path/to/truco

# Backup solo del código
tar czf truco-code-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /path/to/truco

# Backup de imágenes Docker
docker save truco-server:latest | gzip > truco-server.tar.gz
docker save truco-client:latest | gzip > truco-client.tar.gz
```

### Restauración

```bash
# Restaurar archivos
tar xzf truco-backup-20250101.tar.gz -C /

# Restaurar imágenes Docker
docker load < truco-server.tar.gz
docker load < truco-client.tar.gz
```

## Performance

### Optimización de Docker

```bash
# Limpiar cache de build
docker builder prune

# Ver tamaño de imágenes
docker images

# Optimizar imagen (multi-stage build ya implementado)
docker-compose build --no-cache

# Limitar recursos de un contenedor
docker update --memory="512m" --cpus="0.5" truco-server
```

### Análisis de Performance

```bash
# Tiempo de respuesta
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/

# Crear curl-format.txt:
echo "time_namelookup: %{time_namelookup}\ntime_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n" > curl-format.txt

# Benchmark con Apache Bench
ab -n 1000 -c 10 http://localhost/

# Monitoreo continuo
watch -n 1 'docker stats --no-stream'
```

## Troubleshooting Rápido

```bash
# Reinicio completo
docker-compose down && docker-compose up -d --build

# Ver qué está escuchando en un puerto
sudo netstat -tulpn | grep :80
sudo lsof -i :3000

# Matar proceso en un puerto
sudo kill -9 $(sudo lsof -t -i:3000)

# Verificar conectividad
ping tu-vps-ip
telnet tu-vps-ip 80
nc -zv tu-vps-ip 3000

# DNS lookup
nslookup truco.tudominio.com
dig truco.tudominio.com

# Verificar certificado SSL
openssl s_client -connect truco.tudominio.com:443 -servername truco.tudominio.com
```

## Scripts Automatizados

### Script de Deploy Automático

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deployment..."

# Pull de cambios
git pull origin main

# Backup
docker-compose exec server sh -c "tar czf /tmp/backup.tar.gz /app" 2>/dev/null || true

# Deploy
docker-compose down
docker-compose up -d --build

# Verificar
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment exitoso!"
    docker-compose ps
else
    echo "❌ Error en deployment"
    docker-compose logs
    exit 1
fi

# Limpiar
docker image prune -f

echo "🎉 Deployment completado!"
```

### Script de Monitoreo

```bash
#!/bin/bash
# monitor.sh

while true; do
    clear
    echo "=== Estado de Truco Uruguayo ==="
    echo ""
    echo "Contenedores:"
    docker-compose ps
    echo ""
    echo "Recursos:"
    docker stats --no-stream
    echo ""
    echo "Últimos logs:"
    docker-compose logs --tail=5
    sleep 5
done
```

Usa estos scripts:
```bash
chmod +x deploy.sh monitor.sh
./deploy.sh
./monitor.sh
```
