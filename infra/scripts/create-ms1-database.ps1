# MS-1 - PostgreSQL importadora_vehiculos
# Uso: .\scripts\create-ms1-database.ps1

$Schema = Join-Path (Split-Path $PSScriptRoot -Parent) "db\schemas\ms1-setup.sql"
Write-Host "MS-1 - Creando base PostgreSQL importadora_vehiculos..."
Get-Content $Schema | docker exec -i importadora-postgres psql -U postgres
if ($LASTEXITCODE -eq 0) {
    Write-Host "MS-1 OK" -ForegroundColor Green
    docker exec importadora-postgres psql -U postgres -d importadora_vehiculos -c "\dt"
} else {
    Write-Host "MS-1 ERROR - Verifica que Docker y Postgres esten corriendo" -ForegroundColor Red
}
