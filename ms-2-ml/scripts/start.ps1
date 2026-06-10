# Inicia MS-2 Django en puerto 8081
$root = Split-Path $PSScriptRoot -Parent
$venv = Join-Path $root ".venv"

if (-not (Test-Path $venv)) {
    Write-Host "Creando entorno virtual..."
    python -m venv $venv
    & "$venv\Scripts\pip.exe" install -r (Join-Path $root "requirements.txt")
}

$env:POSTGRES_HOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "127.0.0.1" }
$env:POSTGRES_PORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
$env:POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$env:POSTGRES_PASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "admin123" }
$env:POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "importadora_ms2" }

& "$venv\Scripts\python.exe" (Join-Path $root "manage.py") migrate --noinput 2>$null

$proc = Start-Process -FilePath "$venv\Scripts\python.exe" `
    -ArgumentList (Join-Path $root "manage.py"), "runserver", "0.0.0.0:8081" `
    -WorkingDirectory $root `
    -PassThru -WindowStyle Hidden

Write-Host "MS-2 ML PID $($proc.Id) -> http://localhost:8081/health/"
Write-Host "Detener: .\scripts\stop.ps1"
