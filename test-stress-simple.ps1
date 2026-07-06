# SummonScroll API Stress Test - Simple Version
Write-Host "Starting API Stress Test..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$successCount = 0
$failCount = 0
$times = @()

# Test 1: Health Check (50 requests)
Write-Host "`nTest 1: Health Check (50 requests)" -ForegroundColor Yellow
for ($i = 1; $i -le 50; $i++) {
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
        $sw.Stop()
        $times += $sw.ElapsedMilliseconds
        $successCount++
        Write-Progress -Activity "Health Check Test" -Status "Request $i/50" -PercentComplete (($i/50)*100)
    } catch {
        $failCount++
    }
}
Write-Progress -Activity "Health Check Test" -Completed

$avgTime = ($times | Measure-Object -Average).Average
Write-Host "  Success: $successCount/50" -ForegroundColor Green
Write-Host "  Failed: $failCount/50" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "  Avg Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor Cyan

# Test 2: Authentication (25 requests)
Write-Host "`nTest 2: Authentication (25 requests)" -ForegroundColor Yellow
$authSuccess = 0
$authFail = 0
$authTimes = @()

for ($i = 1; $i -le 25; $i++) {
    try {
        $body = '{"email":"crimsonblade@summonscroll.dev","password":"CrimsonBlade123!"}'
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        $sw.Stop()
        $authTimes += $sw.ElapsedMilliseconds
        $authSuccess++
        Write-Progress -Activity "Authentication Test" -Status "Request $i/25" -PercentComplete (($i/25)*100)
    } catch {
        $authFail++
    }
}
Write-Progress -Activity "Authentication Test" -Completed

$authAvgTime = ($authTimes | Measure-Object -Average).Average
Write-Host "  Success: $authSuccess/25" -ForegroundColor Green
Write-Host "  Failed: $authFail/25" -ForegroundColor $(if ($authFail -eq 0) { "Green" } else { "Red" })
Write-Host "  Avg Response Time: $([math]::Round($authAvgTime, 2))ms" -ForegroundColor Cyan

# Test 3: Database Queries (25 requests)
Write-Host "`nTest 3: Database Queries (25 requests)" -ForegroundColor Yellow

# Get token first
$loginBody = '{"email":"crimsonblade@summonscroll.dev","password":"CrimsonBlade123!"}'
$loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).data.tokens.accessToken

$dbSuccess = 0
$dbFail = 0
$dbTimes = @()

for ($i = 1; $i -le 25; $i++) {
    try {
        $headers = @{Authorization = "Bearer $token"}
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$baseUrl/api/realms" -Method GET -Headers $headers -UseBasicParsing
        $sw.Stop()
        $dbTimes += $sw.ElapsedMilliseconds
        $dbSuccess++
        Write-Progress -Activity "Database Query Test" -Status "Request $i/25" -PercentComplete (($i/25)*100)
    } catch {
        $dbFail++
    }
}
Write-Progress -Activity "Database Query Test" -Completed

$dbAvgTime = ($dbTimes | Measure-Object -Average).Average
Write-Host "  Success: $dbSuccess/25" -ForegroundColor Green
Write-Host "  Failed: $dbFail/25" -ForegroundColor $(if ($dbFail -eq 0) { "Green" } else { "Red" })
Write-Host "  Avg Response Time: $([math]::Round($dbAvgTime, 2))ms" -ForegroundColor Cyan

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STRESS TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$totalRequests = 100
$totalSuccess = $successCount + $authSuccess + $dbSuccess
$totalFail = $failCount + $authFail + $dbFail
Write-Host "Total Requests: $totalRequests"
Write-Host "Total Success: $totalSuccess ($([math]::Round(($totalSuccess/$totalRequests)*100, 2))%)" -ForegroundColor Green
Write-Host "Total Failed: $totalFail ($([math]::Round(($totalFail/$totalRequests)*100, 2))%)" -ForegroundColor $(if ($totalFail -eq 0) { "Green" } else { "Red" })

if ($totalFail -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed - review logs" -ForegroundColor Yellow
}
