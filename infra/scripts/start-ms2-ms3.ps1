# Levanta MS-2 (Django) y MS-3 (FastAPI + DL Worker)
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "MS-2 Django..." -ForegroundColor Cyan
& (Join-Path $RepoRoot "ms-2-ml\scripts\start.ps1")

Start-Sleep -Seconds 2

Write-Host "MS-3 DL..." -ForegroundColor Cyan
& (Join-Path $RepoRoot "ms-3-dl\scripts\start.ps1")

Write-Host ""
Write-Host "MS-2 -> http://localhost:8081/health/" -ForegroundColor Green
Write-Host "MS-3 API -> http://localhost:8082/health" -ForegroundColor Green
Write-Host "MS-3 Worker -> http://localhost:5000/health" -ForegroundColor Green
