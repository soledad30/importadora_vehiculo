# Libera el puerto 4200 si quedó ocupado y arranca Angular con proxy fijo.
$ErrorActionPreference = "SilentlyContinue"
$port = 4200

$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
    $pid = $c.OwningProcess
    if ($pid -and $pid -ne $PID) {
        Write-Host "Liberando puerto $port (PID $pid)..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

Set-Location $PSScriptRoot\..
Write-Host "Iniciando Angular en http://localhost:$port (strict-port)..."
npm start
