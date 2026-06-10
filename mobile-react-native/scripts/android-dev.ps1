# Compila/ejecuta Android nativo con JDK 17 (Gradle).
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\use-jdk17.ps1"

Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host ""
Write-Host "Ejecutando expo run:android..."
npx expo run:android @args
