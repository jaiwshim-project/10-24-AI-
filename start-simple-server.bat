@echo off
echo ========================================
echo  RoleCoach AI - Simple HTTP Server
echo ========================================
echo.
echo Starting Python HTTP Server on port 8000...
echo Open: http://localhost:8000/roleplay-hospital-counselor.html
echo.
echo Press Ctrl+C to stop
echo.
cd "%~dp0"
python -m http.server 8000
pause
