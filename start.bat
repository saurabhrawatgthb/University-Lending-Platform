@echo off
echo ========================================================
echo   Starting University Lending Platform (Full Stack)
echo ========================================================
echo.
echo This script will:
echo  1. Install frontend dependencies (if not already installed)
echo  2. Build the Vite React frontend
echo  3. Copy the built frontend into the Spring Boot backend
echo  4. Start the Spring Boot backend on port 8080
echo.
echo Application will be available at: http://localhost:8080
echo ========================================================
echo.

cd backend
call gradlew.bat bootRun

echo.
pause
