# Detiene el proceso que usa el puerto 8080 y arranca ms-1-principal
$ErrorActionPreference = "Stop"

$lines = netstat -ano | Select-String ":8080\s+.*LISTENING"
foreach ($line in $lines) {
    $processId = ($line -split "\s+")[-1]
    if ($processId -match "^\d+$") {
        Write-Host "Deteniendo proceso en puerto 8080 (PID $processId)..."
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2
$still = netstat -ano | Select-String ":8080\s+.*LISTENING"
if ($still) {
    Write-Error "El puerto 8080 sigue en uso. Cierre manualmente el proceso e intente de nuevo."
}

Set-Location (Split-Path $PSScriptRoot -Parent)
$env:POSTGRES_PASSWORD = "admin123"
Write-Host "Iniciando backend en http://localhost:8080 ..."
mvn spring-boot:run
