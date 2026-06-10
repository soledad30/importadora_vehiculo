# Configura inferencia Roboflow cloud (opción C) en ms-3-dl/.env
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey "UawpvlqY8ezwarplPNZt"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
}

$lines = Get-Content $envFile
$settings = @{
    "USE_DL_MODEL" = "true"
    "ROBOFLOW_API_KEY" = $ApiKey
    "ROBOFLOW_WORKSPACE" = "soles-workspace"
    "ROBOFLOW_PROJECT" = "vehicle-damage-detection-nuiry"
    "ROBOFLOW_VERSION" = "1"
}

$out = New-Object System.Collections.Generic.List[string]
$done = @{}

foreach ($line in $lines) {
    if ($line -match '^(?<key>[A-Z_]+)=') {
        $key = $Matches.key
        if ($settings.ContainsKey($key)) {
            $out.Add("$key=$($settings[$key])")
            $done[$key] = $true
            continue
        }
    }
    $out.Add($line)
}

foreach ($key in $settings.Keys) {
    if (-not $done[$key]) {
        $out.Add("$key=$($settings[$key])")
    }
}

Set-Content -Path $envFile -Value ($out -join "`n")

Write-Host "Roboflow cloud configurado en .env" -ForegroundColor Green
Write-Host ""
Write-Host "Instala dependencias (solo la primera vez):" -ForegroundColor Yellow
Write-Host "  .\scripts\install-dl-deps.ps1"
Write-Host ""
Write-Host "Reinicia MS-3:" -ForegroundColor Yellow
Write-Host "  .\scripts\stop.ps1"
Write-Host "  .\scripts\start.ps1"
Write-Host ""
Write-Host "Verifica: http://localhost:5000/health"
Write-Host '  backend debe ser "roboflow_cloud"'
