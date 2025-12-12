# 🎴 Truco Uruguayo - Multiplayer Online

Juego de Truco Uruguayo en tiempo real con Socket.io, React y Node.js.

![Truco Uruguayo](https://img.shields.io/badge/Truco-Uruguayo-blue)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socket.io)

## 🎮 Características

- ✨ **Multiplayer en tiempo real** con WebSockets
- 🎯 **Lógica completa de Truco Uruguayo** (Truco, Envido, Flor)
- 🎨 **Interfaz moderna y responsive** con React y Framer Motion
- 🏠 **Sistema de salas** para jugar con amigos
- 📊 **Puntuación en tiempo real**
- 🔄 **Reconexión automática**

## 🚀 Inicio Rápido

### Desarrollo Local

#### Requisitos
- Node.js 20+
- npm o yarn

#### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/truco.git
cd truco
```

2. **Instalar dependencias del servidor**
```bash
cd server
npm install
```

3. **Instalar dependencias del cliente**
```bash
cd ../client
npm install
```

4. **Iniciar el servidor**
```bash
cd ../server
npm run dev
```

5. **Iniciar el cliente** (en otra terminal)
```bash
cd client
npm run dev
```

6. **Abrir en el navegador**
```
http://localhost:5173
```

### Con Docker (Recomendado para Testing)

#### Requisitos
- Docker
- Docker Compose

#### Inicio Rápido

**Windows:**
```powershell
.\start-docker.ps1
```

**Linux/Mac:**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

**Manual:**
```bash
docker-compose up -d --build
```

Abre tu navegador en `http://localhost`

## 📦 Deployment en Producción

### Dokploy (Recomendado)

Dokploy es una plataforma de deployment open-source para VPS que facilita el deployment de aplicaciones Docker.

#### Pasos:

1. **Instala Dokploy en tu VPS**
   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```

2. **Accede a Dokploy**
   - Abre `http://tu-vps-ip:3000`
   - Completa la configuración inicial

3. **Crea un nuevo proyecto**
   - Tipo: Docker Compose
   - Repositorio: Tu repositorio Git
   - Archivo: `docker-compose.yml`

4. **Configura el dominio**
   - Agrega tu dominio
   - Habilita HTTPS (Let's Encrypt automático)

5. **Deploy**
   - Click en "Deploy"
   - ¡Listo! 🎉

📖 **Guía completa**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md)

📋 **Configuración detallada**: Ver [DOKPLOY_CONFIG.md](./DOKPLOY_CONFIG.md)

🔗 **Cómo conectar tu repositorio**: Ver [DOKPLOY_SETUP_GUIDE.md](./DOKPLOY_SETUP_GUIDE.md)

### Otras Opciones de Deployment

- **VPS Manual**: Usa `docker-compose.yml` directamente
- **Railway**: Soporta Docker Compose
- **Render**: Deploy separado de cliente y servidor
- **DigitalOcean App Platform**: Con Dockerfile

## 🏗️ Arquitectura

```
┌─────────────┐
│   Cliente   │ (React + Vite)
│  (Port 80)  │
└──────┬──────┘
       │ WebSocket/HTTP
       │
┌──────▼──────┐
│    Nginx    │ (Proxy Inverso)
└──────┬──────┘
       │
┌──────▼──────┐
│   Servidor  │ (Node.js + Express + Socket.io)
│ (Port 3000) │
└─────────────┘
```

📖 **Arquitectura detallada**: Ver [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🛠️ Tecnologías

### Frontend
- **React 19** - UI Library
- **Vite** - Build Tool
- **Socket.io Client** - WebSocket Client
- **Framer Motion** - Animaciones
- **React Router** - Routing

### Backend
- **Node.js 20** - Runtime
- **Express** - Web Framework
- **Socket.io** - WebSocket Server
- **UUID** - Generación de IDs

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación
- **Nginx** - Proxy Inverso
- **Dokploy** - Deployment Platform

## 📁 Estructura del Proyecto

```
truco/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── socket.js      # Configuración Socket.io
│   │   └── App.jsx        # Componente principal
│   └── package.json
├── server/                 # Backend Node.js
│   ├── game/              # Lógica del juego
│   │   └── logic.js       # Reglas de Truco
│   ├── index.js           # Servidor principal
│   └── package.json
├── Dockerfile             # Imagen Docker del servidor
├── Dockerfile.client      # Imagen Docker del cliente
├── docker-compose.yml     # Orquestación de contenedores
├── nginx.conf             # Configuración de Nginx
└── dokploy.json          # Configuración de Dokploy
```

## 🎯 Roadmap

- [x] Lógica básica de Truco
- [x] Sistema de salas
- [x] Interfaz de usuario
- [x] Deployment con Docker
- [ ] Persistencia con Redis
- [ ] Sistema de ranking
- [ ] Torneos
- [ ] Chat en sala
- [ ] Estadísticas de jugador
- [ ] Mobile app (React Native)

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 👤 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Comunidad de Truco Uruguayo
- Socket.io Team
- React Team
- Dokploy Team

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

🎴 ¡Buena suerte en tus partidas de Truco! 🎴
