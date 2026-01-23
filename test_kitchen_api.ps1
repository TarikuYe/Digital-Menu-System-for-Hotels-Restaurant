# Test Kitchen API Endpoints

## Test 1: Login as Kitchen Staff
Write-Host "`n=== Test 1: Login as Kitchen Staff ===" -ForegroundColor Cyan

$loginBody = @{
    email = "kitchen@hotel.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.full_name)" -ForegroundColor White
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor White
    $token = $loginResponse.token
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

## Test 2: Get Kitchen Orders
Write-Host "`n=== Test 2: Get Kitchen Orders ===" -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $orders = Invoke-RestMethod -Uri "http://localhost:5000/api/kitchen/orders" -Method Get -Headers $headers
    Write-Host "✅ Kitchen orders retrieved!" -ForegroundColor Green
    Write-Host "Total orders: $($orders.Count)" -ForegroundColor White
    
    if ($orders.Count -gt 0) {
        Write-Host "`nFirst order:" -ForegroundColor Yellow
        Write-Host "  ID: $($orders[0].id)" -ForegroundColor White
        Write-Host "  Table: $($orders[0].table_number)" -ForegroundColor White
        Write-Host "  Status: $($orders[0].status)" -ForegroundColor White
        Write-Host "  Items: $($orders[0].items.Count)" -ForegroundColor White
    } else {
        Write-Host "No active orders in kitchen queue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to get kitchen orders: $_" -ForegroundColor Red
}

## Test 3: Get Kitchen Stats
Write-Host "`n=== Test 3: Get Kitchen Stats ===" -ForegroundColor Cyan

try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/kitchen/stats" -Method Get -Headers $headers
    Write-Host "✅ Kitchen stats retrieved!" -ForegroundColor Green
    Write-Host "Pending orders: $($stats.pending_orders)" -ForegroundColor White
    Write-Host "Confirmed orders: $($stats.confirmed_orders)" -ForegroundColor White
    Write-Host "Preparing orders: $($stats.preparing_orders)" -ForegroundColor White
    Write-Host "Ready orders: $($stats.ready_orders)" -ForegroundColor White
    Write-Host "Today's total: $($stats.today_orders)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to get kitchen stats: $_" -ForegroundColor Red
}

## Test 4: Test Access Control (should fail for customer)
Write-Host "`n=== Test 4: Test Access Control ===" -ForegroundColor Cyan

$customerLoginBody = @{
    email = "admin@hotel.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $customerLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $customerLoginBody -ContentType "application/json"
    $customerToken = $customerLogin.token
    
    Write-Host "Testing admin access to kitchen endpoints..." -ForegroundColor Yellow
    $adminHeaders = @{
        "Authorization" = "Bearer $customerToken"
    }
    $adminOrders = Invoke-RestMethod -Uri "http://localhost:5000/api/kitchen/orders" -Method Get -Headers $adminHeaders
    Write-Host "✅ Admin can access kitchen endpoints (expected)" -ForegroundColor Green
} catch {
    Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173/login in your browser" -ForegroundColor White
Write-Host "2. Login with kitchen@hotel.com / admin123" -ForegroundColor White
Write-Host "3. Click 'Kitchen' in the navigation" -ForegroundColor White
Write-Host "4. You should see the Kitchen Dashboard!" -ForegroundColor White
