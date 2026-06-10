# Instala Ultralytics + PyTorch para inferencia YOLO en el worker MS-3.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$venv = Join-Path $root ".venv"

if (-not (Test-Path $venv)) {
    Write-Host "Ejecuta primero .\scripts\start.ps1 para crear el venv."
    exit 1
}

& "$venv\Scripts\pip.exe" install "ultralytics>=8.3.0" "roboflow>=1.1.50"
Write-Host "Dependencias DL instaladas." -ForegroundColor Green
