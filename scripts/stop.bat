@echo off
REM Stop script for Project Management MVP
REM Usage: scripts\stop.bat

echo.
echo ==========================================
echo Project Management MVP - Stopping
echo ==========================================
echo.

REM Get project directory
for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"

echo Stopping from: %PROJECT_DIR%
echo.

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Stop docker-compose services
echo Stopping Docker containers...
docker-compose down

echo.
echo ==========================================
echo Project Management MVP stopped
echo ==========================================
echo.
