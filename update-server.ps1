# Scripts de Actualización Automática para Crea PDF Puppeteer
# Este script:
# 1. Descarga el código más reciente.
# 2. Reconstruye los contenedores (importante por nuevas librerías).
# 3. Actualiza la estructura de la base de datos (migraciones).
# 4. Asegura que existan los usuarios base (Admin y Operador).

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
}

try {
    # 1. Actualizar Código
    Write-Step "1. Descargando última versión del código (git pull)..."
    git pull
    if ($LASTEXITCODE -ne 0) { throw "Error al hacer git pull" }

    # 2. Reconstruir Contenedores
    Write-Step "2. Reconstruyendo contenedores Docker..."
    # Usamos build --no-cache opcionalmente si hay problemas, pero build normal suele bastar
    docker-compose build
    if ($LASTEXITCODE -ne 0) { throw "Error al construir imágenes" }

    # 3. Reiniciar Servicios
    Write-Step "3. Reiniciando servicios en segundo plano..."
    docker-compose down
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) { throw "Error al levantar contenedores" }

    Write-Host "   Esperando 10 segundos para que la Base de Datos inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # 4. Actualizar Base de Datos (Schema)
    Write-Step "4. Sincronizando esquema de Base de Datos..."
    # Ejecutamos el comando dentro del contenedor 'app'
    docker-compose exec -T app npx prisma db push
    if ($LASTEXITCODE -ne 0) { throw "Error en migración de base de datos" }

    # 5. Migración de Datos y Usuarios
    Write-Step "5. Verificando usuarios y migrando datos huérfanos..."
    docker-compose exec -T app npx ts-node scripts/seed-data.ts
    if ($LASTEXITCODE -ne 0) { throw "Error en script de sembrado de datos" }

    Write-Step "¡ACTUALIZACIÓN COMPLETADA CON ÉXITO! 🚀"
    Write-Host "El sistema está actualizado y corriendo en http://localhost:3000" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ ERROR CRÍTICO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "El proceso se detuvo. Revisa los logs anteriores." -ForegroundColor Red
    exit 1
}
