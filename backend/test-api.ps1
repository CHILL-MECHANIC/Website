# Backend API Test Script
# Tests all available endpoints

$baseUrl = "http://localhost:3001"
$testPhone = "9211970031"

Write-Host "=== Backend API Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Health check passed" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check Rate Limit
Write-Host "2. Testing Rate Limit Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/check-rate-limit?phone=$testPhone" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Rate limit check passed" -ForegroundColor Green
    Write-Host "   Can Request: $($response.canRequest)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Rate limit check failed: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ⚠️  Endpoint not found - auth routes may not be registered" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Send OTP (if rate limit allows)
Write-Host "3. Testing Send OTP..." -ForegroundColor Yellow
try {
    $body = @{
        phone = $testPhone
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/send-otp" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Send OTP passed" -ForegroundColor Green
    Write-Host "   Success: $($response.success)" -ForegroundColor Gray
    if ($response.debug) {
        Write-Host "   Debug OTP: $($response.debug.otp)" -ForegroundColor Magenta
    }
} catch {
    Write-Host "   ❌ Send OTP failed: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ⚠️  Endpoint not found - auth routes may not be registered" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: SMS Logs
Write-Host "4. Testing SMS Logs..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sms/logs" -Method GET -ErrorAction Stop
    Write-Host "   ✅ SMS logs endpoint accessible" -ForegroundColor Green
    Write-Host "   Logs count: $($response.logs.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ SMS logs failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan

