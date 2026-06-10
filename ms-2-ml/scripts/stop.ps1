$lines = netstat -ano | Select-String ":8081\s+.*LISTENING"
foreach ($line in $lines) {
    $processId = ($line -split "\s+")[-1]
    if ($processId -match "^\d+$") {
        Write-Host "Deteniendo PID $processId (puerto 8081)..."
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "MS-2 detenido."
