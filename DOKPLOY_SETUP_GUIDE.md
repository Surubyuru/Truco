# 🚀 Guía Paso a Paso: Configurar Repositorio en Dokploy

## Antes de Empezar

### 1. Sube tu código a GitHub (si no lo has hecho)

```bash
# Inicializa Git (si no está inicializado)
git init

# Agrega todos los archivos
git add .

# Commit
git commit -m "Initial commit - Truco Uruguayo con Dokploy"

# Crea un repositorio en GitHub
# Ve a https://github.com/new
# Nombre: truco (o el que prefieras)
# Público o Privado (tu elección)

# Conecta tu repositorio local con GitHub
git remote add origin https://github.com/TU-USUARIO/truco.git

# Sube el código
git branch -M main
git push -u origin main
```

---

## Configuración en Dokploy

### Paso 1: Acceder a Dokploy

1. Abre tu navegador
2. Ve a: `http://TU-VPS-IP:3000`
3. Inicia sesión con tus credenciales

---

### Paso 2: Crear un Nuevo Proyecto

1. En el panel de Dokploy, busca el botón **"+ New Project"** o **"Create Project"**
2. Click en él

**Verás un formulario con estas opciones:**

```
┌─────────────────────────────────────────┐
│  Create New Project                     │
├─────────────────────────────────────────┤
│                                         │
│  Project Name: [truco-uruguayo____]    │
│                                         │
│  Description: [Juego de Truco...___]   │
│                                         │
└─────────────────────────────────────────┘
```

3. **Project Name**: `truco-uruguayo` (o el nombre que prefieras)
4. **Description**: `Juego de Truco Uruguayo multiplayer` (opcional)
5. Click en **"Create"** o **"Next"**

---

### Paso 3: Seleccionar Tipo de Aplicación

Verás opciones como:

```
┌─────────────────────────────────────────┐
│  Select Application Type                │
├─────────────────────────────────────────┤
│                                         │
│  ○ Dockerfile                          │
│  ● Docker Compose    ← SELECCIONA ESTE │
│  ○ Git + Buildpack                     │
│  ○ GitHub App                          │
│                                         │
└─────────────────────────────────────────┘
```

✅ **Selecciona: "Docker Compose"**

---

### Paso 4: Conectar Repositorio Git

Aquí es donde eliges tu repositorio. Tienes **3 opciones**:

#### **Opción A: GitHub (Recomendado si tu repo es público o privado en GitHub)**

```
┌─────────────────────────────────────────┐
│  Git Provider                           │
├─────────────────────────────────────────┤
│                                         │
│  Provider: [GitHub ▼]                  │
│                                         │
│  [Connect GitHub Account]              │
│                                         │
└─────────────────────────────────────────┘
```

1. **Provider**: Selecciona "GitHub"
2. Click en **"Connect GitHub Account"**
3. Se abrirá una ventana de GitHub pidiendo autorización
4. Autoriza a Dokploy
5. Selecciona tu repositorio de la lista:
   ```
   ┌─────────────────────────────────────┐
   │  Select Repository                  │
   ├─────────────────────────────────────┤
   │  🔍 Search...                       │
   │                                     │
   │  ☐ tu-usuario/proyecto1            │
   │  ☑ tu-usuario/truco    ← ESTE     │
   │  ☐ tu-usuario/otro-proyecto        │
   │                                     │
   └─────────────────────────────────────┘
   ```

#### **Opción B: GitLab**

Similar a GitHub:
1. **Provider**: Selecciona "GitLab"
2. Click en **"Connect GitLab Account"**
3. Autoriza
4. Selecciona tu repositorio

#### **Opción C: URL de Git (Manual - Funciona con cualquier Git)**

Si prefieres no conectar tu cuenta:

```
┌─────────────────────────────────────────┐
│  Git Configuration                      │
├─────────────────────────────────────────┤
│                                         │
│  Repository URL:                        │
│  [https://github.com/usuario/truco.git] │
│                                         │
│  Branch:                                │
│  [main___________________________]      │
│                                         │
│  Authentication (si es privado):        │
│  Username: [tu-usuario___________]      │
│  Password/Token: [ghp_xxxxx______]      │
│                                         │
└─────────────────────────────────────────┘
```

**Para repositorio público:**
- Repository URL: `https://github.com/TU-USUARIO/truco.git`
- Branch: `main`
- No necesitas autenticación

**Para repositorio privado:**
- Repository URL: `https://github.com/TU-USUARIO/truco.git`
- Branch: `main`
- Username: Tu usuario de GitHub
- Password: Un **Personal Access Token** (no tu password)

##### Cómo crear un Personal Access Token en GitHub:

1. Ve a GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token (classic)"
4. Selecciona scope: `repo` (acceso completo al repositorio)
5. Copia el token (empieza con `ghp_...`)
6. Úsalo como password en Dokploy

---

### Paso 5: Configurar Docker Compose

```
┌─────────────────────────────────────────┐
│  Docker Compose Configuration           │
├─────────────────────────────────────────┤
│                                         │
│  Compose File Path:                     │
│  [docker-compose.yml___________]        │
│                                         │
│  Working Directory (opcional):          │
│  [./____________________________]       │
│                                         │
└─────────────────────────────────────────┘
```

- **Compose File Path**: `docker-compose.yml` (ya está en la raíz de tu proyecto)
- **Working Directory**: Déjalo vacío o pon `./`

---

### Paso 6: Variables de Entorno (Opcional)

```
┌─────────────────────────────────────────┐
│  Environment Variables                  │
├─────────────────────────────────────────┤
│                                         │
│  [+ Add Variable]                       │
│                                         │
│  Key          Value                     │
│  NODE_ENV     production                │
│  PORT         3000                      │
│                                         │
└─────────────────────────────────────────┘
```

Agrega (opcional, ya están en docker-compose.yml):
- `NODE_ENV` = `production`
- `PORT` = `3000`

---

### Paso 7: Configurar Dominio (Opcional pero Recomendado)

```
┌─────────────────────────────────────────┐
│  Domain Configuration                   │
├─────────────────────────────────────────┤
│                                         │
│  [+ Add Domain]                         │
│                                         │
│  Domain: [truco.tudominio.com____]     │
│                                         │
│  ☑ Enable HTTPS                        │
│  ☑ Force HTTPS                         │
│  Certificate: [Let's Encrypt ▼]        │
│                                         │
└─────────────────────────────────────────┘
```

**Si tienes un dominio:**
1. Click en **"+ Add Domain"**
2. Ingresa tu dominio: `truco.tudominio.com`
3. ✅ Enable HTTPS
4. ✅ Force HTTPS
5. Certificate: Selecciona "Let's Encrypt"

**Si NO tienes dominio:**
- Déjalo vacío
- Accederás via IP: `http://TU-VPS-IP`

---

### Paso 8: Deploy!

```
┌─────────────────────────────────────────┐
│                                         │
│         [Deploy Application]            │
│                                         │
└─────────────────────────────────────────┘
```

1. Revisa toda la configuración
2. Click en **"Deploy"** o **"Create and Deploy"**

---

## Proceso de Deployment

Verás algo como:

```
┌─────────────────────────────────────────┐
│  Deployment Progress                    │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Cloning repository...               │
│  ✓ Building images...                  │
│  ⏳ Starting containers...              │
│  ⏳ Running health checks...            │
│                                         │
│  [View Logs]                            │
│                                         │
└─────────────────────────────────────────┘
```

**Esto puede tomar 2-5 minutos** dependiendo de:
- Velocidad de tu VPS
- Tamaño de las dependencias
- Velocidad de internet

---

## Verificar el Deployment

### En Dokploy:

1. Ve a **Projects** → **truco-uruguayo**
2. Verás el estado:
   ```
   Status: ● Running
   Containers: 2/2 healthy
   ```

3. Click en **"View Application"** o abre tu dominio

### Manualmente:

```bash
# Conecta a tu VPS
ssh usuario@tu-vps-ip

# Verifica contenedores
docker ps

# Deberías ver algo como:
# truco-server    Up 2 minutes (healthy)
# truco-client    Up 2 minutes (healthy)
```

---

## Configurar Auto-Deploy (Opcional)

Para que Dokploy redesplegue automáticamente cuando hagas push:

### En Dokploy:

1. Ve a tu proyecto → **Settings**
2. Busca **"Auto Deploy"** o **"Webhooks"**
3. ✅ Enable Auto Deploy
4. Copia el **Webhook URL**

### En GitHub:

1. Ve a tu repositorio en GitHub
2. Settings → Webhooks → Add webhook
3. **Payload URL**: Pega el Webhook URL de Dokploy
4. **Content type**: `application/json`
5. **Events**: Selecciona "Just the push event"
6. ✅ Active
7. Add webhook

**Ahora cada vez que hagas `git push`, Dokploy redesplegará automáticamente!** 🎉

---

## Troubleshooting

### "Cannot connect to repository"

**Problema**: Dokploy no puede acceder a tu repositorio

**Solución**:
- Verifica la URL del repositorio
- Si es privado, verifica el token de acceso
- Prueba clonarlo manualmente en tu VPS:
  ```bash
  git clone https://github.com/TU-USUARIO/truco.git
  ```

### "Build failed"

**Problema**: Error al construir las imágenes

**Solución**:
1. Click en **"View Logs"** en Dokploy
2. Lee el error
3. Usualmente es:
   - Archivo faltante (verifica que todos los archivos estén en Git)
   - Error de sintaxis en Dockerfile
   - Dependencia faltante

### "Container unhealthy"

**Problema**: El contenedor inicia pero falla el health check

**Solución**:
```bash
# Conecta al VPS
ssh usuario@tu-vps-ip

# Ver logs
docker logs truco-server
docker logs truco-client

# Ver qué está pasando
docker-compose logs -f
```

---

## Resumen Rápido

```
1. Sube código a GitHub
   ↓
2. Dokploy → New Project
   ↓
3. Tipo: Docker Compose
   ↓
4. Conecta GitHub (o pega URL)
   ↓
5. Selecciona repositorio "truco"
   ↓
6. Branch: "main"
   ↓
7. Compose file: "docker-compose.yml"
   ↓
8. Agrega dominio (opcional)
   ↓
9. Deploy!
   ↓
10. ✅ ¡Listo!
```

---

## Próximos Pasos

Una vez deployado:

1. ✅ Verifica que funcione: Abre tu dominio/IP
2. ✅ Prueba crear una sala
3. ✅ Prueba jugar una partida
4. ✅ Configura auto-deploy (webhook)
5. ✅ Configura backups (opcional)
6. ✅ Configura monitoreo (opcional)

---

## Video Tutorial (Recomendado)

Si prefieres ver un video, busca en YouTube:
- "Dokploy tutorial"
- "How to deploy Docker Compose on Dokploy"
- "Dokploy GitHub integration"

---

¿Tienes alguna pregunta específica sobre algún paso? 🚀
