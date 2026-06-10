# Importa el modelo YOLOv8 exportado desde Roboflow al worker MS-3.
#
# Roboflow (tu proyecto):
#   soles-workspace / vehicle-damage-detection-nuiry
#   Modelo: "detección de daños en vehículos 1"
#
# Pasos en Roboflow:
#   1. Modelos → detección de daños en vehículos 1
#   2. Exportar / Deploy → formato "YOLOv8" o "PyTorch"
#   3. Descargar ZIP y descomprimir
#   4. Buscar best.pt (o weights/best.pt dentro del ZIP)
#
# Uso:
#   .\scripts\import_roboflow_model.ps1 -SourcePath "C:\Downloads\best.pt"
#   .\scripts\import_roboflow_model.ps1 -SourcePath "C:\Downloads\export\weights\best.pt"

param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dest = Join-Path $root "models\damage_yolo.pt"
$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"

if (-not (Test-Path $SourcePath)) {
    Write-Host "ERROR: No existe: $SourcePath" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
Copy-Item -Force $SourcePath $dest
Write-Host "Modelo copiado a:" -ForegroundColor Green
Write-Host "  $dest"

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "Creado .env desde .env.example"
}

$destEsc = $dest -replace '\\', '/'
$content = Get-Content $envFile -Raw
if ($content -match '(?m)^USE_DL_MODEL=') {
    $content = $content -replace '(?m)^USE_DL_MODEL=.*', 'USE_DL_MODEL=true'
} else {
    $content += "`nUSE_DL_MODEL=true`n"
}
if ($content -match '(?m)^DL_DAMAGE_MODEL_PATH=') {
    $content = $content -replace '(?m)^DL_DAMAGE_MODEL_PATH=.*', "DL_DAMAGE_MODEL_PATH=$dest"
} else {
    $content += "DL_DAMAGE_MODEL_PATH=$dest`n"
}
Set-Content -Path $envFile -Value $content.TrimEnd() -NoNewline
Add-Content -Path $envFile -Value ""

Write-Host ""
Write-Host "USE_DL_MODEL=true configurado en .env" -ForegroundColor Cyan
Write-Host "Instala dependencias DL (solo la primera vez):" -ForegroundColor Yellow
Write-Host "  cd ms-3-dl"
Write-Host "  .\.venv\Scripts\pip.exe install ultralytics"
Write-Host ""
Write-Host "Reinicia MS-3:" -ForegroundColor Yellow
Write-Host "  .\scripts\stop.ps1"
Write-Host "  .\scripts\start.ps1"
Write-Host ""
Write-Host "Verifica: http://localhost:5000/health  (dl.modelLoaded debe ser true tras primera inferencia)"
