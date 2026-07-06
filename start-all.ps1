# Start All SummonScroll Services
# This script starts PostgreSQL, Backend, and Frontend

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SummonScroll - Starting All Services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start PostgreSQL
Write-Host "1. Starting PostgreSQL..." -ForegroundColor Yellow
$pgOutput = pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ PostgreSQL started" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    # Check if already running
    $testConn = psql -U shirooalister -d summonscroll -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ PostgreSQL already running" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Failed to start PostgreSQL" -ForegroundColor Red
        Write-Host "   Please start PostgreSQL manually" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Step 2: Start Backend
Write-Host "2. Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   Opening new terminal for backend..." -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev"

Write-Host "   ✓ Backend terminal opened" -ForegroundColor Green
Write-Host "   Backend will be available at: http://localhost:3001" -ForegroundColor Cyan

Start-Sleep -Seconds 3

Write-Host ""

# Step 3: Start Frontend
Write-Host "3. Starting Frontend..." -ForegroundColor Yellow
Write-Host "   Opening new terminal for frontend..." -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host "   ✓ Frontend terminal opened" -ForegroundColor Green
Write-Host "   Frontend will be available at: http://localhost:5173 or 5174" -ForegroundColor Cyan

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  • PostgreSQL: Running on port 5432" -ForegroundColor Gray
Write-Host "  • Backend:    http://localhost:3001" -ForegroundColor Gray
Write-Host "  • Frontend:   http://localhost:5173 (or 5174)" -ForegroundColor Gray
Write-Host ""
Write-Host "Demo Account:" -ForegroundColor White
Write-Host "  • Email:    crimsonblade@summonscroll.dev" -ForegroundColor Gray
Write-Host "  • Password: CrimsonBlade123!" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
