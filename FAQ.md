# ❓ FAQ - Preguntas Frecuentes sobre Deployment

## General

### ¿Qué es Dokploy?
Dokploy es una plataforma open-source de deployment para VPS que facilita el deployment de aplicaciones Docker. Es similar a Vercel o Netlify pero para tu propio servidor.

### ¿Por qué usar Dokploy en lugar de deployment manual?
- ✅ **Interfaz gráfica** fácil de usar
- ✅ **SSL automático** con Let's Encrypt
- ✅ **Proxy inverso** configurado automáticamente
- ✅ **Monitoreo** incluido
- ✅ **Rollback** fácil a versiones anteriores
- ✅ **Deploy automático** desde Git

### ¿Cuánto cuesta?
- **Dokploy**: Gratis y open-source
- **VPS**: Desde $5-12/mes (DigitalOcean, Hetzner, Linode)
- **Dominio**: $10-15/año

## Requisitos

### ¿Qué necesito para deployar?
1. Un VPS (servidor virtual privado)
2. Docker instalado en el VPS
3. Un dominio (opcional pero recomendado)
4. Tu código en un repositorio Git

### ¿Qué especificaciones necesita mi VPS?
**Mínimo**:
- 1 GB RAM
- 1 CPU core
- 10 GB disco
- Ubuntu 20.04+ o Debian 11+

**Recomendado**:
- 2 GB RAM
- 2 CPU cores
- 20 GB disco

### ¿Qué proveedores de VPS recomiendan?
- **DigitalOcean**: Fácil de usar, $6-12/mes
- **Hetzner**: Más barato, €4-8/mes
- **Linode**: Buen balance, $5-10/mes
- **Vultr**: Similar a DigitalOcean
- **AWS/GCP/Azure**: Más caro pero más features

## Docker

### ¿Necesito saber Docker?
No es estrictamente necesario. Los archivos ya están configurados. Pero es útil conocer comandos básicos:
```bash
docker-compose up -d      # Levantar
docker-compose down       # Detener
docker-compose logs -f    # Ver logs
```

### ¿Por qué usar Docker?
- **Consistencia**: Funciona igual en desarrollo y producción
- **Aislamiento**: No afecta otros servicios
- **Portabilidad**: Fácil de mover entre servidores
- **Escalabilidad**: Fácil de escalar horizontalmente

### ¿Puedo deployar sin Docker?
Sí, pero no es recomendado. Necesitarías:
1. Instalar Node.js en el VPS
2. Configurar Nginx manualmente
3. Configurar PM2 o similar para el servidor
4. Configurar SSL manualmente
5. Configurar el firewall

## Dokploy

### ¿Cómo instalo Dokploy?
```bash
curl -sSL https://dokploy.com/install.sh | sh
```

### ¿Dokploy funciona con otros frameworks?
Sí! Dokploy soporta:
- Docker Compose (como este proyecto)
- Dockerfile simple
- Node.js
- Python
- PHP
- Ruby
- Go
- Y más...

### ¿Puedo tener múltiples proyectos en Dokploy?
Sí! Puedes deployar múltiples aplicaciones en el mismo VPS usando Dokploy.

### ¿Dokploy maneja el SSL automáticamente?
Sí, Dokploy usa Traefik y Let's Encrypt para generar certificados SSL automáticamente.

## Networking

### ¿Cómo funcionan los WebSockets con Nginx?
Nginx está configurado para hacer proxy de WebSockets:
```nginx
location /socket.io/ {
    proxy_pass http://server:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### ¿Por qué usar Nginx si ya tengo Express?
- **Performance**: Nginx es más rápido sirviendo archivos estáticos
- **Caching**: Nginx puede cachear assets
- **Compresión**: Nginx maneja gzip eficientemente
- **SSL**: Nginx maneja SSL/TLS
- **Proxy**: Nginx puede hacer load balancing

### ¿Necesito abrir puertos en el firewall?
Solo necesitas:
- Puerto 22 (SSH)
- Puerto 80 (HTTP)
- Puerto 443 (HTTPS)

El puerto 3000 del servidor NO debe estar expuesto públicamente.

## Dominio

### ¿Necesito un dominio?
No es obligatorio, pero es muy recomendado:
- ✅ Más profesional
- ✅ SSL más fácil
- ✅ Fácil de recordar
- ❌ Sin dominio: Usas la IP del VPS

### ¿Cómo configuro el DNS?
En tu registrador de dominio (GoDaddy, Namecheap, etc.):
1. Crea un registro A
2. Apunta a la IP de tu VPS
3. Espera propagación (hasta 48h, usualmente minutos)

### ¿Puedo usar un subdominio?
Sí! Por ejemplo:
- `truco.midominio.com`
- `juego.midominio.com`

Configúralo igual que un dominio normal.

## Seguridad

### ¿Es seguro?
Sí, si sigues las mejores prácticas:
- ✅ Usa HTTPS (Dokploy lo hace automático)
- ✅ Mantén el sistema actualizado
- ✅ Usa firewall (UFW)
- ✅ Usa claves SSH (no passwords)
- ✅ No expongas puertos innecesarios

### ¿Cómo protejo mi VPS?
```bash
# Firewall
sudo ufw enable
sudo ufw allow 22,80,443/tcp

# SSH con clave
ssh-keygen -t rsa -b 4096
ssh-copy-id usuario@vps-ip

# Deshabilitar password login
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart sshd
```

### ¿Qué pasa si alguien ataca mi servidor?
- **DDoS**: Usa Cloudflare (gratis)
- **Brute force SSH**: Usa Fail2ban
- **Rate limiting**: Configurado en Nginx
- **Firewall**: UFW bloquea puertos no autorizados

## Performance

### ¿Cuántos usuarios puede manejar?
Depende de tu VPS:
- **1 GB RAM**: ~50-100 usuarios concurrentes
- **2 GB RAM**: ~200-500 usuarios concurrentes
- **4 GB RAM**: ~1000+ usuarios concurrentes

Para más, necesitas escalar horizontalmente.

### ¿Cómo escalo si tengo muchos usuarios?
1. **Vertical**: Aumenta recursos del VPS
2. **Horizontal**: Múltiples instancias con Redis
3. **CDN**: Usa Cloudflare para assets estáticos
4. **Database**: Usa PostgreSQL/MongoDB para persistencia

### ¿Por qué mi app es lenta?
Verifica:
- [ ] Recursos del VPS (CPU/RAM)
- [ ] Logs de errores
- [ ] Latencia de red
- [ ] Compresión gzip habilitada
- [ ] Cache de assets funcionando

## Debugging

### ¿Cómo veo los logs?
```bash
# Todos los logs
docker-compose logs -f

# Solo servidor
docker-compose logs -f server

# Solo cliente
docker-compose logs -f client

# Últimas 50 líneas
docker-compose logs --tail=50
```

### Mi app no funciona después del deploy
1. **Ver logs**: `docker-compose logs -f`
2. **Verificar contenedores**: `docker-compose ps`
3. **Verificar health checks**: En Dokploy → Metrics
4. **Verificar DNS**: `nslookup tudominio.com`
5. **Verificar SSL**: Abre en navegador

### Los WebSockets no funcionan
Verifica:
- [ ] Nginx configurado correctamente
- [ ] Headers de Upgrade presentes
- [ ] Firewall permite conexiones
- [ ] Cliente usa la URL correcta
- [ ] Logs del servidor no muestran errores

### Error: "Cannot connect to server"
1. Verifica que el servidor esté corriendo: `docker-compose ps`
2. Verifica logs: `docker-compose logs server`
3. Verifica que el puerto 3000 esté escuchando: `docker-compose exec server netstat -tlnp`
4. Verifica networking: `docker network ls`

## Costos

### ¿Cuánto cuesta mantener la app?
**Mensual**:
- VPS: $5-12/mes
- Dominio: ~$1/mes ($12/año)
- **Total**: ~$6-13/mes

**Opcional**:
- CDN (Cloudflare): Gratis
- Backups: $1-2/mes
- Monitoreo (UptimeRobot): Gratis

### ¿Hay costos ocultos?
No, si usas:
- Dokploy (gratis)
- Let's Encrypt (gratis)
- Cloudflare (gratis para básico)

Solo pagas el VPS y el dominio.

## Mantenimiento

### ¿Necesito mantener el servidor?
Sí, pero es mínimo:
- **Semanal**: Revisar logs y métricas
- **Mensual**: Actualizar sistema y Docker
- **Cuando sea necesario**: Deploy de nuevas versiones

### ¿Cómo actualizo mi app?
**Con Dokploy**:
1. Push a Git
2. Dokploy auto-deploya (si está configurado)

**Manual**:
```bash
cd /path/to/truco
git pull origin main
docker-compose up -d --build
```

### ¿Cómo hago backup?
```bash
# Backup del código
tar czf backup.tar.gz /path/to/truco

# Backup automático (cron)
0 2 * * * tar czf /backups/truco-$(date +\%Y\%m\%d).tar.gz /path/to/truco
```

## Problemas Comunes

### "Port 80 already in use"
Otro servicio está usando el puerto 80:
```bash
sudo netstat -tlnp | grep :80
sudo systemctl stop apache2  # Si es Apache
sudo systemctl stop nginx    # Si es Nginx
```

### "Cannot connect to Docker daemon"
Docker no está corriendo:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### "Permission denied"
Necesitas permisos de Docker:
```bash
sudo usermod -aG docker $USER
# Logout y login de nuevo
```

### "SSL certificate error"
Espera unos minutos. Let's Encrypt puede tardar en generar el certificado.

## Migración

### ¿Puedo migrar a otro VPS?
Sí:
1. Backup del código
2. Instala Dokploy en el nuevo VPS
3. Restaura el código
4. Actualiza DNS al nuevo VPS
5. Deploy

### ¿Puedo migrar desde otro servicio?
Sí, si tienes:
- El código en Git
- Las variables de entorno documentadas

## Soporte

### ¿Dónde obtengo ayuda?
1. **Documentación**: Lee los archivos .md del proyecto
2. **Dokploy Discord**: https://discord.gg/dokploy
3. **Docker Docs**: https://docs.docker.com
4. **Stack Overflow**: Para problemas específicos

### ¿Puedo contratar soporte?
Dokploy ofrece soporte enterprise. Para este proyecto específico, puedes:
- Contratar un DevOps freelancer
- Usar servicios managed (más caro)

## Alternativas

### ¿Hay alternativas a Dokploy?
Sí:
- **Coolify**: Similar a Dokploy
- **CapRover**: Otro PaaS self-hosted
- **Portainer**: Gestión de Docker con UI
- **Manual**: Docker Compose + Nginx + Certbot

### ¿Por qué Dokploy sobre las alternativas?
- ✅ Más moderno y activo
- ✅ Mejor UI
- ✅ SSL automático más fácil
- ✅ Mejor integración con Git
- ✅ Comunidad activa

---

## 🆘 ¿No encuentras tu pregunta?

1. Revisa la documentación completa en los archivos .md
2. Busca en GitHub Issues de Dokploy
3. Pregunta en Discord de Dokploy
4. Abre un issue en tu repositorio

---

**¿Tienes más preguntas?** Agrega tus propias preguntas y respuestas aquí! 📝
