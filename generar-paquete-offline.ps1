Write-Host "========================================================="
Write-Host " 📦  GENERADOR DE PAQUETE OFFLINE (LAN/AIR-GAP)  📦"
Write-Host "========================================================="
Write-Host ""
Write-Host "Este script prepara todo lo necesario para desplegar en un servidor SIN INTERNET."
Write-Host "Incluye: Código compilado, Chrome (dentro de Docker) y Base de Datos."
Write-Host ""

# 1. Limpiar versiones previas
if (Test-Path "dist_offline") {
    Remove-Item "dist_offline" -Recurse -Force
}

# 2. Construir la imagen localmente (Aquí es donde se descarga Chrome y se mete en la imagen)
Write-Host "1. Construyendo imagen Docker (esto puede tardar unos minutos)..." -ForegroundColor Cyan
docker build -t crea-pdf-puppeteer:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen." -ForegroundColor Red
    exit 1
}

# 3. Descargar imagen de base de datos para salvarla también
Write-Host "2. Asegurando imagen de Base de Datos (Postgres)..." -ForegroundColor Cyan
docker pull postgres:17-alpine

# 4. Exportar las imágenes a archivos .tar (Portable)
Write-Host "3. Exportando imágenes a archivos .tar (Esto pesará ~1.2GB)..." -ForegroundColor Cyan
Write-Host "   - Exportando App..." 
docker save -o crea-pdf-app.tar crea-pdf-puppeteer:latest

Write-Host "   - Exportando Postgres..." 
docker save -o postgres-db.tar postgres:17-alpine

# 5. Crear carpeta de distribución
Write-Host "4. Empaquetando todo en carpeta 'dist_offline'..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force dist_offline | Out-Null

Move-Item crea-pdf-app.tar dist_offline/
Move-Item postgres-db.tar dist_offline/
Copy-Item docker-compose.yml dist_offline/
Copy-Item instalar-offline.sh dist_offline/

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host " ✅ PAQUETE GENERADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================================="
Write-Host "Instrucciones:"
Write-Host "1. Copia la carpeta 'dist_offline' al servidor (vía USB, SCP, Carpeta compartida)."
Write-Host "2. En el servidor, entra a la carpeta y ejecuta:"
Write-Host "   chmod +x instalar-offline.sh"
Write-Host "   ./instalar-offline.sh"
Write-Host ""
