# RoleCoach AI - Vercel Dev Server Launcher
# PowerShell 스크립트

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RoleCoach AI - Vercel Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 현재 디렉토리로 이동
Set-Location -Path $PSScriptRoot

# .env.local 파일 확인
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local 파일이 없습니다!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "환경 변수를 설정해주세요:" -ForegroundColor Yellow
    Write-Host "1. https://console.anthropic.com/settings/keys 에서 API 키 생성" -ForegroundColor White
    Write-Host "2. .env.local 파일 생성" -ForegroundColor White
    Write-Host "3. 아래 내용 입력:" -ForegroundColor White
    Write-Host "   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx" -ForegroundColor Gray
    Write-Host ""

    $continue = Read-Host "계속 진행하시겠습니까? (Y/N)"
    if ($continue -ne "Y") {
        exit
    }
}

Write-Host "🚀 Vercel Dev 서버를 시작합니다..." -ForegroundColor Green
Write-Host ""
Write-Host "📝 질문이 나오면:" -ForegroundColor Yellow
Write-Host "   1. Set up? → Y 입력" -ForegroundColor White
Write-Host "   2. Which scope? → dentalclinicfonder 선택 (Enter)" -ForegroundColor White
Write-Host "   3. Link to existing? → N 입력" -ForegroundColor White
Write-Host "   4. Project name? → rolecoach-ai 입력" -ForegroundColor White
Write-Host "   5. Code directory? → ./ (Enter)" -ForegroundColor White
Write-Host ""
Write-Host "✅ 'Ready! Available at http://localhost:3000' 메시지가 보이면 성공!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to start..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Vercel Dev 실행
npx vercel dev --listen 3000

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
