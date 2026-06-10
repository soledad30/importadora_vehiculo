# MS-3 - DynamoDB + S3 MinIO
# Uso: .\scripts\create-ms3-database.ps1

$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Script = Join-Path (Split-Path $PSScriptRoot -Parent) "db\schemas\ms3-setup-dynamodb.py"
$Python = Join-Path $RepoRoot "ms-3-dl\.venv\Scripts\python.exe"

Write-Host "MS-3 - Creando tablas DynamoDB + bucket S3..."
if (-not (Test-Path $Python)) { $Python = "python" }

& $Python -m pip install boto3 -q 2>$null
& $Python $Script
if ($LASTEXITCODE -eq 0) {
    Write-Host "MS-3 OK" -ForegroundColor Green
} else {
    Write-Host "MS-3 ERROR - Verifica DynamoDB :8000 y MinIO :9000" -ForegroundColor Red
}
