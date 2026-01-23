# PowerShell script to create .env file
# Run this script: .\setup-env.ps1

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "❌ Cancelled. Existing .env file preserved." -ForegroundColor Red
        exit
    }
}

# Generate secure JWT secret
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

$envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=Tare@kiya

# JWT Configuration
# This is a randomly generated secret key - keep it secure!
JWT_SECRET=$jwtSecret
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
"@

try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host "✅ .env file created successfully!" -ForegroundColor Green
    Write-Host "📁 Location: $envPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Configuration:" -ForegroundColor Cyan
    Write-Host "   - Database: hotel_menu_system"
    Write-Host "   - User: postgres"
    Write-Host "   - Password: Tare@kiya"
    Write-Host "   - JWT_SECRET: Generated randomly"
    Write-Host "   - Port: 5000"
    Write-Host "   - CORS: http://localhost:5173"
    Write-Host ""
    Write-Host "💡 If your PostgreSQL password is different, edit DB_PASSWORD in .env" -ForegroundColor Yellow
    Write-Host "💡 Keep JWT_SECRET secure and never commit it to git!" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Error creating .env file: $_" -ForegroundColor Red
    exit 1
}

