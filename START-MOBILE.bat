@echo off
cd /d "%~dp0"
if not exist node_modules\@anthropic-ai\sdk\package.json (
  call npm.cmd install --no-audit --no-fund --no-package-lock
  if errorlevel 1 goto end
)
call npm.cmd run dev:mobile
:end
pause
