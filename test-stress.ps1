# SummonScroll API Stress Test
# Tests concurrent requests and load handling

Write-Host "🔥 Starting SummonScroll API Stress Test..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"
$results = @{
    TotalRequests = 0
    SuccessfulRequests = 0
    FailedRequests = 0
    AverageResponseTime = 0
    MinResponseTime = [double]::MaxValue
    MaxResponseTime = 0
}

# Test 1: Health Check Stress Test
Write-Host "Test 1: Health Check Stress Test (100 concurrent requests)" -ForegroundColor Yellow
$healthCheckTimes = @()
$jobs = @()

for ($i = 1; $i -le 100; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url)
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $response = Invoke-WebRequest -Uri "$url/health" -Method GET -TimeoutSec 10
            $sw.Stop()
            return @{
                Success = $true
                Time = $sw.ElapsedMilliseconds
                StatusCode = $response.StatusCode
            }
        } catch {
            $sw.Stop()
            return @{
                Success = $false
                Time = $sw.ElapsedMilliseconds
                Error = $_.Exception.Message
            }
        }
    } -ArgumentList $baseUrl
}

$jobResults = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$successCount = ($jobResults | Where-Object { $_.Success }).Count
$avgTime = ($jobResults | Measure-Object -Property Time -Average).Average
$minTime = ($jobResults | Measure-Object -Property Time -Minimum).Minimum
$maxTime = ($jobResults | Measure-Object -Property Time -Maximum).Maximum

Write-Host "  ✓ Completed: $successCount/100 successful" -ForegroundColor Green
Write-Host "  ⏱ Avg Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor Cyan
Write-Host "  ⏱ Min Response Time: $([math]::Round($minTime, 2))ms" -ForegroundColor Cyan
Write-Host "  ⏱ Max Response Time: $([math]::Round($maxTime, 2))ms" -ForegroundColor Cyan
Write-Host ""

$results.TotalRequests += 100
$results.SuccessfulRequests += $successCount
$results.FailedRequests += (100 - $successCount)

# Test 2: Authentication Load Test
Write-Host "Test 2: Authentication Load Test (50 login requests)" -ForegroundColor Yellow
$authJobs = @()

for ($i = 1; $i -le 50; $i++) {
    $authJobs += Start-Job -ScriptBlock {
        param($url)
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $body = @{
                email = 'crimsonblade@summonscroll.dev'
                password = 'CrimsonBlade123!'
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri "$url/api/auth/login" -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 10
            $sw.Stop()
            return @{
                Success = $true
                Time = $sw.ElapsedMilliseconds
                StatusCode = $response.StatusCode
            }
        } catch {
            $sw.Stop()
            return @{
                Success = $false
                Time = $sw.ElapsedMilliseconds
                Error = $_.Exception.Message
            }
        }
    } -ArgumentList $baseUrl
}

$authResults = $authJobs | Wait-Job | Receive-Job
$authJobs | Remove-Job

$authSuccessCount = ($authResults | Where-Object { $_.Success }).Count
$authAvgTime = ($authResults | Measure-Object -Property Time -Average).Average
$authMinTime = ($authResults | Measure-Object -Property Time -Minimum).Minimum
$authMaxTime = ($authResults | Measure-Object -Property Time -Maximum).Maximum

Write-Host "  ✓ Completed: $authSuccessCount/50 successful" -ForegroundColor Green
Write-Host "  ⏱ Avg Response Time: $([math]::Round($authAvgTime, 2))ms" -ForegroundColor Cyan
Write-Host "  ⏱ Min Response Time: $([math]::Round($authMinTime, 2))ms" -ForegroundColor Cyan
Write-Host "  ⏱ Max Response Time: $([math]::Round($authMaxTime, 2))ms" -ForegroundColor Cyan
Write-Host ""

$results.TotalRequests += 50
$results.SuccessfulRequests += $authSuccessCount
$results.FailedRequests += (50 - $authSuccessCount)

# Test 3: Database Query Load Test
Write-Host "Test 3: Database Query Load Test (50 concurrent realm queries)" -ForegroundColor Yellow

# First, get a token
$loginBody = @{
    email = 'crimsonblade@summonscroll.dev'
    password = 'CrimsonBlade123!'
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType 'application/json'
$token = ($loginResponse.Content | ConvertFrom-Json).data.tokens.accessToken

$dbJobs = @()

for ($i = 1; $i -le 50; $i++) {
    $dbJobs += Start-Job -ScriptBlock {
        param($url, $authToken)
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $headers = @{
                Authorization = "Bearer $authToken"
            }
            $response = Invoke-WebRequest -Uri "$url/api/realms" -Method GET -Headers $headers -TimeoutSec 10
            $sw.Stop()
            return @{
                Success = $true
                Time = $sw.ElapsedMilliseconds
                StatusCode = $response.StatusCode
            }
        } catch {
            $sw.Stop()
            return @{
                Success = $false
                Time = $sw.ElapsedMilliseconds
                Error = $_.Exception.Message
            }
        }
    } -ArgumentList $baseUrl, $token
}

$dbResults = $dbJobs | Wait-Job | Receive-Job
$dbJobs | Remove-Job

$dbSuccessCount = ($dbResults | Where-Object { $_.Success }).Count
$dbAvgTime = ($dbResults | Measure-Object -Property Time -Average).Average
$dbMinTime = ($dbResults | Measure-Object -Property Time -Minimum).Minimum
$dbMaxTime = ($dbResults | Measure-Object -Property Time -Maximum).Maximum

Write-Host "  ✓ Completed: $dbSuccessCount/50 successful" -ForegroundColor Green
Write-Host "  ⏱ Avg Response Time: $([math]::Round($dbAvgTime, 2))ms" -ForegroundColor Cyan
Write-Host "  ⏱ Min Response Time: $([math]::Round($dbMinTime, 2))ms" -ForegroundColor Cyan
Write-Host "  ⏱ Max Response Time: $([math]::Round($dbMaxTime, 2))ms" -ForegroundColor Cyan
Write-Host ""

$results.TotalRequests += 50
$results.SuccessfulRequests += $dbSuccessCount
$results.FailedRequests += (50 - $dbSuccessCount)

# Final Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 STRESS TEST SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Requests:      $($results.TotalRequests)" -ForegroundColor White
Write-Host "Successful:          $($results.SuccessfulRequests) ($([math]::Round(($results.SuccessfulRequests / $results.TotalRequests) * 100, 2))%)" -ForegroundColor Green
Write-Host "Failed:              $($results.FailedRequests) ($([math]::Round(($results.FailedRequests / $results.TotalRequests) * 100, 2))%)" -ForegroundColor $(if ($results.FailedRequests -eq 0) { "Green" } else { "Red" })
Write-Host ""

$overallAvg = [math]::Round((($avgTime + $authAvgTime + $dbAvgTime) / 3), 2)
Write-Host "Overall Avg Response Time: ${overallAvg}ms" -ForegroundColor Cyan
Write-Host ""

if ($results.FailedRequests -eq 0) {
    Write-Host "✅ ALL TESTS PASSED - System is stable under load!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some requests failed - Review error logs" -ForegroundColor Yellow
}
Write-Host ""
