# Quick start for local backend + frontend
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start_local.ps1

$root = Split-Path $PSCommandPath -Parent

# Launch backend (nodemon) on 127.0.0.1:5000 in a new window
Start-Process powershell -WorkingDirectory "$root\..\backend" -ArgumentList @(
    '-NoProfile',
    '-Command', '$env:HOST="127.0.0.1"; $env:PORT="5000"; npm run dev'
)

# Build + launch frontend static server on 127.0.0.1:8080 in a new window
Start-Process powershell -WorkingDirectory "$root\..\frontend" -ArgumentList @(
    '-NoProfile',
    '-Command', 'npm run build; $env:HOST="127.0.0.1"; $env:PORT="8080"; node .\serve.js'
)

Write-Host "Backend and frontend launch commands started in new PowerShell windows." -ForegroundColor Green
Write-Host "Backend: http://127.0.0.1:5000 | Frontend: http://127.0.0.1:8080" -ForegroundColor Green
