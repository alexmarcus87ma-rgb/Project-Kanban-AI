#!/bin/bash

# Stop script for Project Management MVP
# Usage: ./scripts/stop.sh

set -e

echo "=========================================="
echo "Project Management MVP - Stopping"
echo "=========================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Stopping from: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR"

# Stop docker-compose services
echo "Stopping Docker containers..."
docker-compose down

echo ""
echo "=========================================="
echo "Project Management MVP stopped"
echo "=========================================="
