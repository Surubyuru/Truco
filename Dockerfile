# Dockerfile para el servidor de Truco
FROM node:20-alpine

# Instalar wget para healthchecks
RUN apk add --no-cache wget

WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY server/package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código del servidor
COPY server/ ./

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar el servidor
CMD ["node", "index.js"]
