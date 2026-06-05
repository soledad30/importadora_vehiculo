# Libera el puerto 8080 (detiene Java/Spring Boot en ese puerto)
$lines = netstat -ano | Select-String ":8080\s+.*LISTENING"
if (-not $lines) {
    Write-Host "Puerto 8080 libre. No hay nada que detener."
    exit 0
}

foreach ($line in $lines) {
    $processId = ($line -split "\s+")[-1]
    if ($processId -match "^\d+$") {
        Write-Host "Deteniendo PID $processId ..."
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 1
if (netstat -ano | Select-String ":8080\s+.*LISTENING") {
    Write-Warning "El puerto 8080 aun esta en uso."
} else {
    Write-Host "Puerto 8080 liberado. Ya puede ejecutar: mvn spring-boot:run"
}
