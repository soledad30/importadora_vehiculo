# Orden recomendado para levantar todo el stack con API Gateway
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "=== Importadora Vehiculos - Stack completo ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Infraestructura Docker (Postgres, DynamoDB, MinIO, Gateway)..." -ForegroundColor Yellow
Set-Location (Join-Path $RepoRoot "infra")
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[2/5] Bases de datos..." -ForegroundColor Yellow
& (Join-Path $RepoRoot "infra\scripts\create-all-databases.ps1")

Write-Host ""
Write-Host "[3/5] Inicie MS-1 en otra terminal:" -ForegroundColor Yellow
Write-Host "  cd ms-1-principal; mvn spring-boot:run" -ForegroundColor White

Write-Host "[4/5] Inicie MS-2 y MS-3 en otra terminal:" -ForegroundColor Yellow
Write-Host "  cd infra; .\scripts\start-ms2-ms3.ps1" -ForegroundColor White

Write-Host "[5/5] Inicie Angular en otra terminal:" -ForegroundColor Yellow
Write-Host "  cd frontend-angular; npm run start:kill" -ForegroundColor White

Write-Host ""
Write-Host "=== Abra el portal en ===" -ForegroundColor Green
Write-Host "  http://localhost:8888   (API Gateway - recomendado)" -ForegroundColor Green
Write-Host "  http://localhost:4200   (Angular directo, solo dev)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Health gateway: http://localhost:8888/gateway/health" -ForegroundColor Cyan
