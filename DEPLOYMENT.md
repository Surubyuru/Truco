# 🎴 Truco Uruguayo - Deployment en Dokploy

Este proyecto está configurado para desplegarse fácilmente en un VPS usando **Dokploy**.

## 📋 Requisitos Previos

1. Un VPS con Docker y Docker Compose instalados
2. Dokploy instalado en tu VPS ([Guía de instalación](https://docs.dokploy.com/get-started/installation))
3. Un dominio apuntando a tu VPS (opcional pero recomendado)

## 🚀 Deployment con Dokploy

### Opción 1: Desde la UI de Dokploy (Recomendado)

1. **Accede a tu panel de Dokploy** (generalmente en `http://tu-vps-ip:3000`)

2. **Crea un nuevo proyecto**:
   - Click en "New Project"
   - Nombre: `truco-uruguayo`
   - Tipo: `Docker Compose`

3. **Configura el repositorio**:
   - Conecta tu repositorio Git
   - Branch: `main` (o la que uses)
   - Compose File: `docker-compose.yml`

4. **Configura el dominio** (opcional):
   - En la sección "Domains"
   - Agrega tu dominio: `truco.tudominio.com`
   - Habilita HTTPS con Let's Encrypt

5. **Deploy**:
   - Click en "Deploy"
   - Dokploy automáticamente:
     - Clonará el repositorio
     - Construirá las imágenes Docker
     - Levantará los contenedores
     - Configurará el proxy inverso

### Opción 2: Deployment Manual con Docker Compose

Si prefieres hacerlo manualmente en tu VPS:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/truco.git
cd truco

# 2. Construir y levantar los contenedores
docker-compose up -d --build

# 3. Verificar que los contenedores están corriendo
docker-compose ps

# 4. Ver los logs
docker-compose logs -f
```

## 🔧 Configuración de Variables de Entorno

Si necesitas configurar variables de entorno adicionales, crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3000
NODE_ENV=production

# Cliente (opcional)
VITE_SOCKET_URL=https://truco.tudominio.com
```

## 📦 Estructura de Deployment

El proyecto se despliega con dos contenedores:

1. **truco-server**: Servidor Node.js con Express y Socket.io (puerto 3000)
2. **truco-client**: Cliente React servido por Nginx (puerto 80)

Nginx actúa como proxy inverso, sirviendo el cliente y redirigiendo las peticiones de Socket.io al servidor.

## 🌐 Configuración de Dominio

### Con Dokploy (Automático)

Dokploy configura automáticamente:
- Proxy inverso con Traefik
- Certificados SSL con Let's Encrypt
- Redirección HTTP → HTTPS

### Manual con Nginx

Si usas Nginx directamente en tu VPS:

```nginx
server {
    listen 80;
    server_name truco.tudominio.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 Verificación del Deployment

1. **Verificar contenedores**:
```bash
docker-compose ps
```

2. **Ver logs del servidor**:
```bash
docker-compose logs -f server
```

3. **Ver logs del cliente**:
```bash
docker-compose logs -f client
```

4. **Probar la aplicación**:
   - Abre tu navegador en `http://tu-dominio.com` o `http://tu-vps-ip`
   - Deberías ver la interfaz del juego de Truco

## 🔄 Actualizar la Aplicación

### Con Dokploy:
1. Haz push a tu repositorio
2. En Dokploy, click en "Redeploy"
3. Dokploy automáticamente reconstruirá y redesplegará

### Manual:
```bash
# 1. Pull de los cambios
git pull origin main

# 2. Reconstruir y reiniciar
docker-compose up -d --build

# 3. Limpiar imágenes antiguas (opcional)
docker image prune -f
```

## 🛠️ Troubleshooting

### Los WebSockets no funcionan
- Verifica que nginx esté configurado para hacer proxy de WebSockets
- Revisa los logs: `docker-compose logs -f server`
- Asegúrate de que el firewall permita conexiones en el puerto 80

### Error de CORS
- Verifica que el cliente esté accediendo al servidor a través del mismo dominio
- En producción, nginx maneja el proxy, no debería haber problemas de CORS

### Contenedores no inician
```bash
# Ver logs detallados
docker-compose logs

# Reconstruir desde cero
docker-compose down -v
docker-compose up -d --build
```

## 📊 Monitoreo

Dokploy incluye:
- Métricas de CPU y memoria
- Logs en tiempo real
- Estado de los contenedores
- Alertas (configurable)

## 🔐 Seguridad

Recomendaciones:
- Usa HTTPS en producción (Dokploy lo configura automáticamente)
- Configura un firewall (UFW en Ubuntu):
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```
- Mantén Docker y Dokploy actualizados

## 📝 Notas Adicionales

- El servidor usa memoria para almacenar el estado de las salas
- Para producción seria, considera usar Redis para el estado compartido
- Los logs se almacenan en los contenedores (usa `docker-compose logs`)

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica la documentación de Dokploy: https://docs.dokploy.com
3. Revisa que Docker esté corriendo: `docker ps`

---

¡Buena suerte con tu deployment! 🎴🎉
