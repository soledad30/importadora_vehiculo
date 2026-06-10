# Arranca MS-1 si el puerto 8080 está libre
$ErrorActionPreference = "Stop"

$listening = netstat -ano | Select-String ":8080\s+.*LISTENING"
if ($listening) {
    Write-Host "MS-1 ya está corriendo en http://localhost:8080"
    Write-Host "Para reiniciar use: .\scripts\restart-backend.ps1"
    exit 0
}

Set-Location (Split-Path $PSScriptRoot -Parent)
$env:POSTGRES_PASSWORD = "admin123"
Write-Host "Iniciando MS-1 en http://localhost:8080 ..."
mvn spring-boot:run
