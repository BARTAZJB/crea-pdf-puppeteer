Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA DE PLANTILLAS HTML" -ForegroundColor Cyan
Write-Host "Convirtiendo datos a variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$templatesPath = "src\templates"

# Definir reemplazos globales (comunes a todas las plantillas)
$globalReplacements = @{
    # Fechas
    "11 de noviembre de 2025" = "{{FECHA_SOLICITUD}}"
    "22 de octubre de 2025" = "{{INICIO_ACTIVIDADES}}"
    "12 de noviembre de 2025" = "{{FIN_ACTIVIDADES}}"
    
    # Números de reporte
    "570919" = "{{REPORTE_MESA_SERVICIOS}}"
    "567890" = "{{REPORTE_MESA_SERVICIOS}}"
    
    # Ubicaciones genéricas
    "CDMX" = "{{CIUDAD}}"
    "Tlalnepantla de Baz" = "{{CIUDAD}}"
    "Estado de México" = "{{ESTADO}}"
    "Estado de Mexico" = "{{ESTADO}}"
    
    # Códigos postales
    "04340," = "{{CODIGO_POSTAL}},"
    "04340" = "{{CODIGO_POSTAL}}"
    "54090" = "{{CODIGO_POSTAL}}"
    
    # Direcciones
    "Insurgentes Sur No. 2416" = "{{DIRECCION}}"
    "Av. Adolfo López Mateos S/N" = "{{DIRECCION}}"
    "Av. Adolfo Lopez Mateos S/N" = "{{DIRECCION}}"
    
    # IDs genéricos
    "DATO_A_RELLENAR_PO" = "{{CURP}}"
    "DATO_A_RELLEN" = "{{RFC}}"
    "Dato_A_Rellenar_Por_Usuario" = "{{DATO_USUARIO}}"
}

# Función para limpiar una plantilla
function Clear-Template {
    param(
        [string]$filePath,
        [hashtable]$replacements
    )
    
    $fileName = Split-Path $filePath -Leaf
    Write-Host "Procesando: $fileName" -ForegroundColor Yellow
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $originalContent = $content
    $changeCount = 0
    
    foreach ($key in $replacements.Keys) {
        $value = $replacements[$key]
        $regex = [regex]::Escape($key)
        $matchCount = ([regex]$regex).Matches($content).Count
        
        if ($matchCount -gt 0) {
            $content = $content -replace $regex, $value
            $changeCount += $matchCount
            Write-Host "  ✓ '$key' → '$value' ($matchCount veces)" -ForegroundColor Green
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "  ✅ Archivo actualizado ($changeCount cambios)" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️  Sin cambios" -ForegroundColor Gray
    }
    
    Write-Host ""
    return $changeCount
}

# Procesar todas las plantillas
$totalChanges = 0

# 1. Alta de usuario interno
$file1 = Join-Path $templatesPath "Alta_de_cuenta_de_usuario_interno.html"
if (Test-Path $file1) {
    $totalChanges += Clear-Template -filePath $file1 -replacements $globalReplacements
}

# 2. Alta de cuenta de servicio
$file2 = Join-Path $templatesPath "Alta_de_cuenta_de_servicio.html"
if (Test-Path $file2) {
    $totalChanges += Clear-Template -filePath $file2 -replacements $globalReplacements
}

# 3. Baja de usuario interno
$file3 = Join-Path $templatesPath "Baja_de_cuenta_de_usuario_interno.html"
if (Test-Path $file3) {
    $totalChanges += Clear-Template -filePath $file3 -replacements $globalReplacements
}

# 4. Baja de usuario externo
$file4 = Join-Path $templatesPath "Baja_de_cuenta_de_usuario_externo.html"
if (Test-Path $file4) {
    $totalChanges += Clear-Template -filePath $file4 -replacements $globalReplacements
}

# 5. Baja de cuenta de servicio
$file5 = Join-Path $templatesPath "Baja_de_cuenta_de_servicio.html"
if (Test-Path $file5) {
    $totalChanges += Clear-Template -filePath $file5 -replacements $globalReplacements
}

# 6. Cambio en usuario interno
$file6 = Join-Path $templatesPath "Cambio_en_cuenta_de_usuario_interno.html"
if (Test-Path $file6) {
    $totalChanges += Clear-Template -filePath $file6 -replacements $globalReplacements
}

# 7. Cambio en usuario externo
$file7 = Join-Path $templatesPath "Cambio_en_cuenta_de_usuario_externo.html"
if (Test-Path $file7) {
    $totalChanges += Clear-Template -filePath $file7 -replacements $globalReplacements
}

# 8. Cambio en cuenta de servicio
$file8 = Join-Path $templatesPath "Cambio_en_cuenta_de_servicio.html"
if (Test-Path $file8) {
    $totalChanges += Clear-Template -filePath $file8 -replacements $globalReplacements
}

# Resumen final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total de cambios realizados: $totalChanges" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host "  1. Compilar: npm run build" -ForegroundColor White
Write-Host "  2. Copiar templates: xcopy /E /I /Y src\templates dist\templates" -ForegroundColor White
Write-Host "  3. Copiar views: xcopy /E /I /Y src\views dist\views" -ForegroundColor White
Write-Host "  4. Iniciar: npm start" -ForegroundColor White
Write-Host ""