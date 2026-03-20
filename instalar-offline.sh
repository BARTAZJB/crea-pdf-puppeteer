#!/bin/bash

echo "========================================================="
echo " 🌐  INSTALADOR MODO OFFLINE (LAN)  🌐"
echo "========================================================="

# 1. Verificar si Docker está instalado
if ! command -v docker &> /dev/null
then
    echo "❌ ERROR: Docker no está instalado en este servidor."
    exit 1
fi

# 2. Cargar imágenes desde los archivos .tar
echo "1. Cargando imágenes Docker (esto puede tardar unos segundos)..."

if [ -f "crea-pdf-app.tar" ]; then
    echo "   - Cargando Aplicación..."
    docker load -i crea-pdf-app.tar
else
    echo "⚠️  ADVERTENCIA: No se encontró 'crea-pdf-app.tar'."
fi

if [ -f "postgres-db.tar" ]; then
    echo "   - Cargando Base de Datos..."
    docker load -i postgres-db.tar
else
    echo "⚠️  ADVERTENCIA: No se encontró 'postgres-db.tar'."
fi

# 3. Levantar los servicios
echo "2. Iniciando contenedores..."

# Determinar comando de docker compose
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose no encontrado."
    exit 1
fi

$DOCKER_COMPOSE_CMD up -d

echo "3. Esperando a que el sistema inicie (15s)..."
sleep 15

echo "4. Preparando Base de Datos..."
# Ejecutar migraciones para crear tablas
$DOCKER_COMPOSE_CMD exec -T app npx prisma migrate deploy || echo "⚠️  No se pudieron ejecutar las migraciones (¿Ya existen?)"

echo "5. Creando Usuario Administrador..."
# Crear usuario admin por defecto
$DOCKER_COMPOSE_CMD exec -T app node dist/scripts/create-admin.js || echo "⚠️  No se pudo crear el admin (¿Ya existe?)"

echo "========================================================="
echo " ✅ INSTALACIÓN COMPLETADA"
echo "========================================================="
echo "La aplicación debería estar corriendo en el puerto 3000."
echo "Usuario Admin: admin@conagua.gob.mx"
echo "Contraseña:    admin"
