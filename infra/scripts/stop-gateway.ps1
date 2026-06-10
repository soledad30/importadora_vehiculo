$InfraDir = Split-Path $PSScriptRoot -Parent
Set-Location $InfraDir
docker compose stop gateway
Write-Host "Gateway detenido." -ForegroundColor Yellow
