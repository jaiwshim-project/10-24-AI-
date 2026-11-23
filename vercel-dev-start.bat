@echo off
echo ========================================
echo  RoleCoach AI - Vercel Dev Server
echo ========================================
echo.
echo Starting Vercel Dev Server...
echo.
cd "%~dp0"
npx vercel dev --listen 3000
pause
