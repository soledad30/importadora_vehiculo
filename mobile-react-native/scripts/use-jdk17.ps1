# Fija JAVA_HOME a JDK 17 (requerido por Gradle/Android; Java 25 no es compatible).
# Uso: . .\scripts\use-jdk17.ps1

function Find-Jdk17Path {
    $seen = [System.Collections.Generic.HashSet[string]]::new()
    $candidates = [System.Collections.Generic.List[string]]::new()

    foreach ($root in @(
            'C:\Program Files\Eclipse Adoptium',
            'C:\Program Files\Microsoft',
            'C:\Program Files\Java',
            'C:\Program Files\Eclipse Foundation'
        )) {
        if (-not (Test-Path $root)) { continue }

        Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match 'jdk-17|17\.' } |
            Sort-Object Name -Descending |
            ForEach-Object { $candidates.Add($_.FullName) }
    }

    foreach ($path in $candidates) {
        if (-not $seen.Add($path)) { continue }

        $javaExe = Join-Path $path 'bin\java.exe'
        if (-not (Test-Path $javaExe)) { continue }

        $version = & $javaExe -version 2>&1 | Out-String
        if ($version -match 'version "17') {
            return $path
        }
    }

    return $null
}

$jdk17 = Find-Jdk17Path
if (-not $jdk17) {
    Write-Error @"
No se encontro JDK 17 en rutas habituales de Windows.
Instala Eclipse Temurin 17: https://adoptium.net/temurin/releases/?version=17
O define JAVA_HOME manualmente antes de compilar Android.
"@
}

$env:JAVA_HOME = $jdk17
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host "JAVA_HOME -> $env:JAVA_HOME"
java -version 2>&1 | ForEach-Object { Write-Host $_ }
