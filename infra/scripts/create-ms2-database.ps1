# MS-2 - PostgreSQL importadora_ms2
# Uso: .\scripts\create-ms2-database.ps1

$Schema = Join-Path (Split-Path $PSScriptRoot -Parent) "db\schemas\ms2-setup.sql"
Write-Host "MS-2 - Creando base PostgreSQL importadora_ms2..."
Get-Content $Schema | docker exec -i importadora-postgres psql -U postgres
if ($LASTEXITCODE -eq 0) {
    Write-Host "MS-2 OK" -ForegroundColor Green
    docker exec importadora-postgres psql -U postgres -d importadora_ms2 -c "\dt"
} else {
    Write-Host "MS-2 ERROR - Verifica que Docker y Postgres esten corriendo" -ForegroundColor Red
}
