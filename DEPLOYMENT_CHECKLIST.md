# ✅ Checklist de Deployment para Dokploy

## Pre-Deployment

### Código
- [ ] Todo el código está commiteado en Git
- [ ] Las pruebas pasan localmente
- [ ] No hay credenciales hardcodeadas
- [ ] Variables de entorno configuradas en `.env.example`
- [ ] README.md actualizado
- [ ] Versión actualizada en `package.json`

### Docker
- [ ] `Dockerfile` optimizado (multi-stage build)
- [ ] `docker-compose.yml` configurado correctamente
- [ ] `.dockerignore` incluye archivos innecesarios
- [ ] Health checks configurados
- [ ] Límites de recursos definidos
- [ ] Build local exitoso: `docker-compose up --build`

### Configuración
- [ ] `nginx.conf` configurado para WebSockets
- [ ] CORS configurado correctamente
- [ ] Socket.io configurado para producción
- [ ] Puertos correctos en todos los archivos

## VPS Setup

### Servidor
- [ ] VPS creado y accesible via SSH
- [ ] Sistema operativo actualizado: `sudo apt update && sudo apt upgrade`
- [ ] Docker instalado: `docker --version`
- [ ] Docker Compose instalado: `docker-compose --version`
- [ ] Firewall configurado (UFW):
  - [ ] Puerto 22 (SSH)
  - [ ] Puerto 80 (HTTP)
  - [ ] Puerto 443 (HTTPS)
  - [ ] Puerto 3000 (Dokploy) - opcional

### Dokploy
- [ ] Dokploy instalado: `curl -sSL https://dokploy.com/install.sh | sh`
- [ ] Dokploy accesible en `http://vps-ip:3000`
- [ ] Usuario administrador creado
- [ ] Panel de Dokploy funcional

### Dominio
- [ ] Dominio comprado
- [ ] DNS configurado:
  - [ ] Registro A apuntando a la IP del VPS
  - [ ] Registro AAAA (si usas IPv6)
  - [ ] Propagación DNS completada (puede tomar hasta 48h)
- [ ] Dominio resuelve correctamente: `nslookup tudominio.com`

## Deployment en Dokploy

### Configuración del Proyecto
- [ ] Nuevo proyecto creado en Dokploy
- [ ] Nombre del proyecto: `truco-uruguayo`
- [ ] Tipo seleccionado: `Docker Compose`
- [ ] Repositorio Git conectado
- [ ] Branch configurada: `main`
- [ ] Archivo compose: `docker-compose.yml`
- [ ] Auto-deploy habilitado (opcional)

### Variables de Entorno
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] Otras variables según necesidad

### Dominio y SSL
- [ ] Dominio agregado en Dokploy
- [ ] HTTPS habilitado
- [ ] Certificado Let's Encrypt configurado
- [ ] Force HTTPS habilitado
- [ ] Redirección www → no-www (o viceversa)

### Deploy
- [ ] Primer deploy ejecutado
- [ ] Build completado sin errores
- [ ] Contenedores corriendo: Estado "Up"
- [ ] Health checks pasando

## Post-Deployment

### Verificación Funcional
- [ ] Sitio accesible en `https://tudominio.com`
- [ ] Página principal carga correctamente
- [ ] Assets estáticos cargan (CSS, JS, imágenes)
- [ ] WebSockets funcionan correctamente
- [ ] Crear sala funciona
- [ ] Unirse a sala funciona
- [ ] Juego funciona end-to-end
- [ ] Reconexión automática funciona

### Verificación Técnica
- [ ] Certificado SSL válido (candado verde)
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs del servidor
- [ ] No hay errores en los logs del cliente
- [ ] Health checks reportan "healthy"
- [ ] Métricas de CPU/RAM normales

### Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] Latencia de WebSocket < 100ms
- [ ] Compresión gzip funcionando
- [ ] Cache de assets funcionando
- [ ] No hay memory leaks

### Seguridad
- [ ] HTTPS forzado (no se puede acceder via HTTP)
- [ ] Headers de seguridad presentes:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security
- [ ] No se exponen secretos en el código
- [ ] Firewall activo y configurado
- [ ] SSH con clave (no password)

### Monitoreo
- [ ] Logs accesibles en Dokploy
- [ ] Métricas visibles en Dokploy
- [ ] Alertas configuradas (opcional)
- [ ] Backup automático configurado (opcional)

### Documentación
- [ ] README.md actualizado con URL de producción
- [ ] Credenciales guardadas en lugar seguro
- [ ] Equipo notificado del deployment
- [ ] Documentación de runbooks creada

## Testing en Producción

### Funcionalidad
- [ ] Crear cuenta/login (si aplica)
- [ ] Crear sala
- [ ] Unirse a sala con código
- [ ] Iniciar partida
- [ ] Jugar una mano completa
- [ ] Cantar Truco
- [ ] Cantar Envido
- [ ] Cantar Flor
- [ ] Ganar una partida
- [ ] Desconexión y reconexión

### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (si es posible)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Mantenimiento

### Configuración Continua
- [ ] Proceso de actualización documentado
- [ ] Proceso de rollback documentado
- [ ] Backup automático configurado
- [ ] Monitoreo de uptime configurado (UptimeRobot, etc.)
- [ ] Notificaciones de downtime configuradas

### Optimización
- [ ] CDN configurado (opcional)
- [ ] Redis para sesiones (si es necesario)
- [ ] Database para persistencia (si es necesario)
- [ ] Rate limiting configurado (si es necesario)

## Rollback Plan

En caso de problemas:

1. **Rollback en Dokploy**:
   - [ ] Ir a Deployments
   - [ ] Seleccionar deployment anterior
   - [ ] Click en "Rollback"

2. **Rollback Manual**:
   ```bash
   cd /path/to/truco
   git checkout <commit-anterior>
   docker-compose down
   docker-compose up -d --build
   ```

3. **Restaurar Backup**:
   ```bash
   tar xzf backup.tar.gz -C /
   docker-compose up -d
   ```

## Contactos de Emergencia

- **Proveedor VPS**: _________________
- **Registrador de Dominio**: _________________
- **Equipo de Desarrollo**: _________________
- **Soporte Dokploy**: https://discord.gg/dokploy

## Notas Adicionales

### Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Reiniciar servicio
docker-compose restart server

# Ver estado
docker-compose ps

# Acceder al contenedor
docker-compose exec server sh
```

### URLs Importantes

- **Producción**: https://tudominio.com
- **Dokploy Panel**: http://vps-ip:3000
- **Repositorio**: https://github.com/tu-usuario/truco
- **Documentación**: https://docs.dokploy.com

---

## ✅ Deployment Completado

Fecha: _______________
Deployado por: _______________
Versión: _______________
Commit: _______________

**Firma**: _______________

---

🎉 **¡Felicitaciones por tu deployment exitoso!** 🎉

Recuerda:
- Monitorear los logs regularmente
- Mantener el sistema actualizado
- Hacer backups periódicos
- Documentar cualquier cambio

¡Buena suerte con tu aplicación! 🎴
