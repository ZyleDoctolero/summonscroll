# Stop PostgreSQL Server
# Run this script to gracefully stop PostgreSQL

Write-Host "Stopping PostgreSQL..." -ForegroundColor Cyan

try {
    $output = pg_ctl -D "C:\Program Files\PostgreSQL\18\data" stop 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL may not be running or already stopped" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
