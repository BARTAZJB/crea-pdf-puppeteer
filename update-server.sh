#!/bin/bash
# Scripts de Actualización Automática para Crea PDF Puppeteer (Linux)

echo ""
echo "=========================================="
echo " 🚀 INICIANDO ACTUALIZACIÓN SERVIDOR"
echo "=========================================="
echo ""

# 1. Actualizar Código
echo "1. Descargando última versión del código (git pull)..."
if command -v git &> /dev/null; then
    git pull
else
    echo "❌ ERROR: Git no está instalado."
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló git pull. Revisa tu conexión o estado del repo."
    exit 1
fi

# 2. Reconstruir Contenedores
echo ""
echo "2. Reconstruyendo contenedores Docker..."
docker-compose build
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló la construcción de Docker."
    exit 1
fi

# 3. Reiniciar Servicios
echo ""
echo "3. Reiniciando servicios en segundo plano..."
docker-compose down
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló al levantar servicios."
    exit 1
fi

echo "   Esperando 10 segundos para inicialización de DB..."
sleep 10

# 4. Actualizar Base de Datos (Schema)
echo ""
echo "4. Sincronizando esquema de Base de Datos..."
docker-compose exec -T app npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló la migración de Prisma."
    exit 1
fi

# 5. Migración de Datos y Usuarios
echo ""
echo "5. Verificando usuarios y migrando datos huérfanos..."
docker-compose exec -T app npx ts-node scripts/seed-data.ts
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló el sembrado de datos iniciales."
    exit 1
fi

echo ""
echo "=========================================="
echo " ✅ ACTUALIZACIÓN COMPLETADA CON ÉXITO"
echo " El sistema está corriendo y actualizado."
echo "=========================================="
exit 0
