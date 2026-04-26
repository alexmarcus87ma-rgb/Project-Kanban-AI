@echo off
REM Start script for Project Management MVP
REM Usage: scripts\start.bat

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Project Management MVP - Starting
echo ==========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found in project root
    echo Please create .env file with OPENROUTER_API_KEY
    exit /b 1
)

REM Check if docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed
    exit /b 1
)

REM Get project directory
for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"

echo Starting from: %PROJECT_DIR%
echo.

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Load environment variables from .env
for /f "tokens=*" %%i in (.env) do (
    if not "%%i"=="" (
        if not "%%i:~0,1%%" equ "#" (
            set "%%i"
        )
    )
)

REM Start docker-compose services
echo Starting Docker containers...
docker-compose up -d

REM Wait for backend to be ready
echo Waiting for backend to be ready...
setlocal enabledelayedexpansion
set "max_attempts=30"
set "attempt=0"

:wait_loop
if %attempt% geq %max_attempts% goto wait_timeout

REM Try to reach health check endpoint
timeout /t 1 /nobreak >nul
curl -s http://localhost:8000/api/health >nul 2>&1
if errorlevel 0 (
    echo Backend is ready!
    goto ready
)

set /a attempt=%attempt%+1
echo Waiting... ^(!attempt!/%max_attempts%^)
goto wait_loop

:wait_timeout
echo Warning: Backend did not respond within timeout

:ready
echo.
echo ==========================================
echo Project Management MVP is running
echo ==========================================
echo Frontend: http://localhost:8000/
echo API Health: http://localhost:8000/api/health
echo.
echo To stop the application, run: scripts\stop.bat
echo To view logs: docker-compose logs -f
echo ==========================================
echo.
