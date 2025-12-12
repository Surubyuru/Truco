#!/bin/sh
# Health check script para el contenedor del servidor

# Verificar que el servidor responde en el puerto 3000
wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

echo "Server is healthy"
exit 0
