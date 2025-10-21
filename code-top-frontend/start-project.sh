#!/bin/bash

echo "Starting Medusa Next.js project..."

# Check if Docker is running
if ! docker version > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

echo "Docker is running"

# Start database containers
echo "Starting PostgreSQL and Redis containers..."
docker-compose up -d

# Wait for containers to be ready
echo "Waiting for containers to be ready..."
sleep 10

# Check if containers are running
if docker ps --filter "name=medusa-postgres" --format "table {{.Status}}" | grep -q "Up" && \
   docker ps --filter "name=medusa-redis" --format "table {{.Status}}" | grep -q "Up"; then
    echo "Containers are running successfully!"
else
    echo "Error: Some containers failed to start"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    yarn install
fi

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    
    cat > .env.local << EOF
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
EOF
    
    echo ".env.local file created. Please update the secrets if needed."
fi

echo "Starting development server..."
echo "Note: You need to start Medusa server separately on port 9000"
echo "You can use: npx create-medusa-app@latest"

# Start the Next.js development server
yarn dev
