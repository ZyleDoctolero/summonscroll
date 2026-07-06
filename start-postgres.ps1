# Start PostgreSQL Server
# Run this script if PostgreSQL is not running

Write-Host "Starting PostgreSQL..." -ForegroundColor Cyan

try {
    # Try to start using pg_ctl
    $output = pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL started successfully!" -ForegroundColor Green
        
        # Wait a moment for server to be ready
        Start-Sleep -Seconds 2
        
        # Test connection
        $testResult = psql -U shirooalister -d summonscroll -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database connection verified!" -ForegroundColor Green
        } else {
            Write-Host "⚠ PostgreSQL started but connection test failed" -ForegroundColor Yellow
            Write-Host "  This is normal if the database is still initializing" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Failed to start PostgreSQL" -ForegroundColor Red
        Write-Host $output
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
