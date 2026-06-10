# =============================================================================
# Crea / verifica las 3 bases de datos (una por microservicio)
#
# Uso:
#   cd infra
#   .\scripts\create-all-databases.ps1
#
# MS-1  PostgreSQL  importadora_vehiculos  (tablas: al arrancar Spring Boot)
# MS-2  PostgreSQL  importadora_ms2       (tablas: Django migrate)
# MS-3  DynamoDB    ms3-* + MinIO bucket  (este script)
# =============================================================================

$ErrorActionPreference = "Stop"
$InfraRoot = Split-Path $PSScriptRoot -Parent
$RepoRoot = Split-Path $InfraRoot -Parent

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# pip escribe avisos en stderr; con $ErrorActionPreference Stop eso aborta el script
function Invoke-PipQuiet([string]$Python, [string[]]$PipArgs) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $Python -m pip @PipArgs 2>&1 | Out-Null
    $ErrorActionPreference = $prev
    if ($LASTEXITCODE -ne 0) { throw "pip fallo: $($PipArgs -join ' ')" }
}

# 1. Docker
Write-Step "Verificando Docker..."
try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host "ERROR: Docker Desktop no esta corriendo. Inicialo y vuelve a ejecutar." -ForegroundColor Red
    exit 1
}

Write-Step "Levantando infraestructura (Postgres + DynamoDB + MinIO)..."
Set-Location $InfraRoot
docker compose up -d

# 2. Esperar PostgreSQL
Write-Step "Esperando PostgreSQL..."
$retries = 30
for ($i = 1; $i -le $retries; $i++) {
    docker exec importadora-postgres pg_isready -U postgres -d importadora_vehiculos 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    if ($i -eq $retries) {
        Write-Host "ERROR: PostgreSQL no respondio a tiempo." -ForegroundColor Red
        exit 1
    }
    Start-Sleep -Seconds 2
}
Write-Host "  PostgreSQL listo." -ForegroundColor Green

# 3. MS-1 + MS-2 - bases PostgreSQL
Write-Step "MS-1 / MS-2 - PostgreSQL"

$dbMs1 = docker exec importadora-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='importadora_vehiculos'"
if ($dbMs1 -match "1") {
    Write-Host "  = MS-1 base: importadora_vehiculos" -ForegroundColor Green
} else {
    Write-Host "  ! Base importadora_vehiculos no encontrada" -ForegroundColor Yellow
}

Write-Host "  Creando MS-2 base: importadora_ms2 si no existe..."
Get-Content (Join-Path $PSScriptRoot "create-ms2-db.sql") | docker exec -i importadora-postgres psql -U postgres 2>$null

$dbMs2 = docker exec importadora-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='importadora_ms2'"
if ($dbMs2 -match "1") {
    Write-Host "  = MS-2 base: importadora_ms2" -ForegroundColor Green
} else {
    Write-Host "  ERROR: No se pudo crear importadora_ms2" -ForegroundColor Red
    exit 1
}

# 4. MS-2 - tablas Django
Write-Step "MS-2 - tablas Django migrate"
$ms2Venv = Join-Path $RepoRoot "ms-2-ml\.venv\Scripts\python.exe"
$ms2Manage = Join-Path $RepoRoot "ms-2-ml\manage.py"

if (Test-Path $ms2Venv) {
    Invoke-PipQuiet $ms2Venv @("install", "psycopg[binary]", "-q")
    $env:POSTGRES_HOST = "localhost"
    $env:POSTGRES_PORT = "5432"
    $env:POSTGRES_USER = "postgres"
    $env:POSTGRES_PASSWORD = "admin123"
    $env:POSTGRES_DB = "importadora_ms2"
    & $ms2Venv $ms2Manage migrate --noinput
    Write-Host "  Tablas MS-2 OK" -ForegroundColor Green
} else {
    Write-Host "  ! Venv MS-2 no encontrado. Ejecuta: cd ms-2-ml; .\scripts\start.ps1" -ForegroundColor Yellow
}

# 5. MS-3 - DynamoDB + MinIO
Write-Step "MS-3 - DynamoDB + MinIO"
Start-Sleep -Seconds 3

$ms3Venv = Join-Path $RepoRoot "ms-3-dl\.venv\Scripts\python.exe"
$initMs3 = Join-Path $PSScriptRoot "init-ms3-dynamodb.py"

if (Test-Path $ms3Venv) {
    Invoke-PipQuiet $ms3Venv @("install", "boto3", "-q")
    & $ms3Venv $initMs3
} else {
    python -m pip install boto3 -q 2>$null
    python $initMs3
}

# 6. Resumen
Write-Step "Resumen - bases por microservicio"
Write-Host ""
Write-Host "  MS-1  PostgreSQL   importadora_vehiculos   :5432"
Write-Host "  MS-2  PostgreSQL   importadora_ms2          :5432"
Write-Host "  MS-3  DynamoDB     ms3-documentos          :8000"
Write-Host "  MS-3  DynamoDB     ms3-inspecciones         :8000"
Write-Host "  MS-3  MinIO S3      importadora-ms3-docs     :9000"
Write-Host ""

Write-Step "Bases PostgreSQL"
docker exec importadora-postgres psql -U postgres -c "\l" | Select-String "importadora"

Write-Step "Tablas MS-2"
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker exec importadora-postgres psql -U postgres -d importadora_ms2 -c "\dt" 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = $prev

Write-Host ""
Write-Host "Siguiente - MS-1 tablas via Hibernate:" -ForegroundColor Yellow
Write-Host "  cd ms-1-principal; mvn spring-boot:run"
Write-Host ""
Write-Host "Iniciar MS-2 y MS-3:" -ForegroundColor Yellow
Write-Host "  cd ms-2-ml; .\scripts\start.ps1"
Write-Host "  cd ms-3-dl; .\scripts\start.ps1"
Write-Host ""
Write-Host "Listo." -ForegroundColor Green
