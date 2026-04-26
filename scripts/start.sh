#!/bin/bash

# Start script for Project Management MVP
# Usage: ./scripts/start.sh

set -e

echo "=========================================="
echo "Project Management MVP - Starting"
echo "=========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in project root"
    echo "Please create .env file with OPENROUTER_API_KEY"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Starting from: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR"

# Load .env file
export $(cat .env | grep -v '#' | xargs)

# Start docker-compose services
echo "Starting Docker containers..."
docker-compose up -d

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    attempt=$((attempt+1))
    echo "Waiting... ($attempt/$max_attempts)"
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo "Warning: Backend did not respond within timeout"
fi

echo ""
echo "=========================================="
echo "Project Management MVP is running"
echo "=========================================="
echo "Frontend: http://localhost:8000/"
echo "API Health: http://localhost:8000/api/health"
echo ""
echo "To stop the application, run: ./scripts/stop.sh"
echo "To view logs: docker-compose logs -f"
echo "=========================================="
