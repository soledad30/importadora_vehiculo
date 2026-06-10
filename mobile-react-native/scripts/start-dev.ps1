# Arranca Expo con JDK 17 (evita error Gradle: Unsupported class file major version 69).
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\use-jdk17.ps1"

Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host ""
Write-Host "Iniciando Expo (QR / 'a' Android / 'i' iOS)..."
npm start
