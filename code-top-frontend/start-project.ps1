# PowerShell script to start the Medusa Next.js project with Docker

Write-Host "Starting Medusa Next.js project..." -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start database containers
Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for containers to be ready
Write-Host "Waiting for containers to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if containers are running
$postgresStatus = docker ps --filter "name=medusa-postgres" --format "table {{.Status}}"
$redisStatus = docker ps --filter "name=medusa-redis" --format "table {{.Status}}"

if ($postgresStatus -like "*Up*" -and $redisStatus -like "*Up*") {
    Write-Host "Containers are running successfully!" -ForegroundColor Green
} else {
    Write-Host "Error: Some containers failed to start" -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    yarn install
}

# Create .env.local file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    
    @"
# Database
DATABASE_URL=postgres://medusa:medusa123@localhost:5432/medusa

# Redis
REDIS_URL=redis://localhost:6379

# Medusa Server
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Stripe (optional - add your keys if needed)
# NEXT_PUBLIC_STRIPE_KEY=your_stripe_public_key

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Cookie Secret
COOKIE_SECRET=your_cookie_secret_here
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    
    Write-Host ".env.local file created. Please update the secrets if needed." -ForegroundColor Yellow
}

Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Note: You need to start Medusa server separately on port 9000" -ForegroundColor Yellow
Write-Host "You can use: npx create-medusa-app@latest" -ForegroundColor Cyan

# Start the Next.js development server
yarn dev
