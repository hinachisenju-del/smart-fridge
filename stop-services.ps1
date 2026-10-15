<#
.SYNOPSIS
  Stops all running Smart List services (Ports 8082, 8081, 5173).
#>

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Smart List - Stopping All Services    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ports = @(8082, 8081, 5173)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            try {
                $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Stopping $($proc.ProcessName) (PID: $p) on port $port..." -ForegroundColor Yellow
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "Could not terminate process $p." -ForegroundColor Red
            }
        }
        Write-Host "Port $port is now released." -ForegroundColor Green
    } else {
        Write-Host "Port $port is not in use." -ForegroundColor DarkGray
    }
}

Write-Host "`nAll Smart List background services stopped successfully." -ForegroundColor Green
