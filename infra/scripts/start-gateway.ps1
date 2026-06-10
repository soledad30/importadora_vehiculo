# Levanta solo el API Gateway (Nginx) en http://localhost:8888
$InfraDir = Split-Path $PSScriptRoot -Parent
Set-Location $InfraDir

Write-Host "Iniciando API Gateway (Nginx) en http://localhost:8888 ..." -ForegroundColor Cyan
docker compose up -d gateway

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al iniciar el gateway. ¿Docker Desktop está activo?" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Gateway activo:" -ForegroundColor Green
Write-Host "  Portal web  -> http://localhost:8888"
Write-Host "  MS-1 API    -> http://localhost:8888/api/v1"
Write-Host "  MS-2 API    -> http://localhost:8888/ms2/api"
Write-Host "  MS-3 API    -> http://localhost:8888/ms3/api"
Write-Host "  Health      -> http://localhost:8888/gateway/health"
Write-Host ""
Write-Host "Requisitos: MS-1 (:8080), MS-2 (:8081), MS-3 (:8082) y Angular (:4200) deben estar corriendo en el host." -ForegroundColor Yellow
