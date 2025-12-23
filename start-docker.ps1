
Write-Host "Iniciando Truco en Docker..."
if (-not (docker network ls --filter name=dokploy-network -q)) {
    docker network create dokploy-network
}
docker-compose down
docker-compose up -d --build
Write-Host "Listo! http://localhost"
