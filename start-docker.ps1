# Script de inicio rápido para testing local con Docker (Windows)

Write-Host "🎴 Iniciando Truco Uruguayo en Docker..." -ForegroundColor Cyan

# Verificar que Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop primero." -ForegroundColor Red
    exit 1
}

# Verificar que Docker Compose está disponible
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero." -ForegroundColor Red
    exit 1
}

# Detener contenedores existentes
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

# Construir y levantar contenedores
Write-Host "🔨 Construyendo imágenes..." -ForegroundColor Yellow
docker-compose build

Write-Host "🚀 Levantando contenedores..." -ForegroundColor Yellow
docker-compose up -d

# Esperar a que los contenedores estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar estado
Write-Host "`n📊 Estado de los contenedores:" -ForegroundColor Cyan
docker-compose ps

# Mostrar logs
Write-Host "`n📝 Logs recientes:" -ForegroundColor Cyan
docker-compose logs --tail=20

Write-Host "`n✅ ¡Truco Uruguayo está corriendo!" -ForegroundColor Green
Write-Host "🌐 Abre tu navegador en: http://localhost" -ForegroundColor Green
Write-Host "`nPara ver los logs en tiempo real:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host "`nPara detener los contenedores:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
