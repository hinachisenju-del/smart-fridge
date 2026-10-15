# Starts all Smart List services (ML Service, Backend API, Frontend Dev Server)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Smart List - Starting All Services    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start ML Service (Port 8082)
$mlPort = Get-NetTCPConnection -LocalPort 8082 -ErrorAction SilentlyContinue
if (-not $mlPort) {
    Write-Host "[1/3] Starting Scikit-Learn ML Service on port 8082..." -ForegroundColor Yellow
    $mlLog = Join-Path $ScriptDir "ml_service\ml_service.log"
    Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory (Join-Path $ScriptDir "ml_service") -RedirectStandardOutput $mlLog -RedirectStandardError $mlLog -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/3] ML Service already running on port 8082." -ForegroundColor Green
}

# 2. Start Backend Service (Port 8081)
$backendPort = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Write-Host "[2/3] Starting Spring Boot Backend on port 8081..." -ForegroundColor Yellow
    $backendJar = Join-Path $ScriptDir "backend\target\smart-fridge-backend-0.1.0-SNAPSHOT.jar"
    $backendLog = Join-Path $ScriptDir "backend\backend.log"
    if (Test-Path $backendJar) {
        Start-Process -FilePath "java" -ArgumentList @("-jar", $backendJar) -WorkingDirectory (Join-Path $ScriptDir "backend") -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -WindowStyle Hidden
    } else {
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "mvnw.cmd", "spring-boot:run") -WorkingDirectory (Join-Path $ScriptDir "backend") -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -WindowStyle Hidden
    }
    Start-Sleep -Seconds 4
} else {
    Write-Host "[2/3] Backend already running on port 8081." -ForegroundColor Green
}

# 3. Start Frontend (Port 5173)
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $frontendPort) {
    Write-Host "[3/3] Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
    $frontendLog = Join-Path $ScriptDir "frontend\frontend.log"
    Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npm", "run", "dev", "--", "--host") -WorkingDirectory (Join-Path $ScriptDir "frontend") -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendLog -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[3/3] Frontend already running on port 5173." -ForegroundColor Green
}

Write-Host "All Smart List services are up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:8081/api/health"
Write-Host "ML Engine: http://localhost:8082/health"
Write-Host "To stop services, run stop-services.ps1"
