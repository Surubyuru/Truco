# Simplified start script
Write-Host "Starting Docker..."
if (docker network ls --filter name=dokploy-network -q) {
    Write-Host "Network exists."
}
else {
    docker network create dokploy-network
}
docker-compose down
docker-compose up -d --build
Write-Host "Done! Check http://localhost"
