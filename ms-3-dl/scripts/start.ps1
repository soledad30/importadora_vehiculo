# Inicia MS-3: worker DL (5000) + API (8082)
$root = Split-Path $PSScriptRoot -Parent
$venv = Join-Path $root ".venv"

if (-not (Test-Path $venv)) {
    Write-Host "Creando entorno virtual..."
    python -m venv $venv
    & "$venv\Scripts\pip.exe" install -r (Join-Path $root "requirements.txt")
}

$worker = Start-Process -FilePath "$venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000" `
    -WorkingDirectory (Join-Path $root "dl-worker") `
    -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 2

$api = Start-Process -FilePath "$venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082" `
    -WorkingDirectory (Join-Path $root "api") `
    -PassThru -WindowStyle Hidden

Write-Host "MS-3 DL Worker PID $($worker.Id) -> http://localhost:5000/health"
Write-Host "MS-3 API       PID $($api.Id) -> http://localhost:8082/health"
Write-Host "Detener: .\scripts\stop.ps1"
