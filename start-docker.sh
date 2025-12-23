#!/bin/bash

# Script de inicio rápido para testing local con Docker

echo "🎴 Iniciando Truco Uruguayo en Docker..."

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Crear red dokploy-network si no existe
docker network inspect dokploy-network >/dev/null 2>&1 || \
    docker network create dokploy-network

# Construir y levantar contenedores
echo "🔨 Construyendo imágenes..."
docker-compose build

echo "🚀 Levantando contenedores..."
docker-compose up -d --build

# Esperar a que los contenedores estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 5

# Verificar estado
echo "📊 Estado de los contenedores:"
docker-compose ps

# Mostrar logs
echo ""
echo "📝 Logs recientes:"
docker-compose logs --tail=20

echo ""
echo "✅ ¡Truco Uruguayo está corriendo!"
echo "🌐 Abre tu navegador en: http://localhost"
echo ""
echo "Para ver los logs en tiempo real:"
echo "  docker-compose logs -f"
echo ""
echo "Para detener los contenedores:"
echo "  docker-compose down"
