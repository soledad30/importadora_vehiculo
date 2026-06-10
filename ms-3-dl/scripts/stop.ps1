# Libera puertos 5000 y 8082 (MS-3)
foreach ($port in @("5000", "8082")) {
    $lines = netstat -ano | Select-String ":$port\s+.*LISTENING"
    foreach ($line in $lines) {
        $processId = ($line -split "\s+")[-1]
        if ($processId -match "^\d+$") {
            Write-Host "Deteniendo PID $processId (puerto $port)..."
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "MS-3 detenido."
