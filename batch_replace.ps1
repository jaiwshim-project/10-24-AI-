# PowerShell script to batch replace CSS in roleplay files

$files = @(
    "roleplay-debate-interview.html",
    "roleplay-doctor-explanation.html",
    "roleplay-education-counseling.html",
    "roleplay-executive-presentation.html",
    "roleplay-foreign-patient.html",
    "roleplay-global-buyer.html",
    "roleplay-global-pitch.html",
    "roleplay-government-grant.html",
    "roleplay-hospital-counselor.html",
    "roleplay-hospital.html",
    "roleplay-insurance.html",
    "roleplay-interview.html",
    "roleplay-labor.html",
    "roleplay-leadership-feedback.html",
    "roleplay-legal.html",
    "roleplay-live-commerce.html",
    "roleplay-ministry.html",
    "roleplay-poc-partnership.html",
    "roleplay-policy-announcement.html",
    "roleplay-politics.html",
    "roleplay-psychological-coaching.html",
    "roleplay-realestate.html",
    "roleplay-sales.html",
    "roleplay-startup.html",
    "roleplay-tax-accounting.html"
)

$oldPattern = @"
    /\* 파스텔톤 3D 클레이 스타일 이모티콘 \*/
    \.emoji-3d \{
      display: inline-block;
      font-style: normal;
      text-shadow:
        2px 2px 4px rgba\(0, 0, 0, 0\.15\),
        -1px -1px 2px rgba\(255, 255, 255, 0\.7\),
        0 0 8px rgba\(255, 255, 255, 0\.5\);
      filter:
        brightness\(1\.1\)
        saturate\(0\.85\)
        drop-shadow\(0 2px 4px rgba\(0, 0, 0, 0\.1\)\);
      transform: translateZ\(0\);
      transition: all 0\.2s ease;
      border-radius: 50%;
      padding: 0\.1em;
    \}

    \.emoji-3d:hover \{
      transform: translateY\(-2px\) scale\(1\.05\);
      filter:
        brightness\(1\.15\)
        saturate\(0\.9\)
        drop-shadow\(0 4px 8px rgba\(0, 0, 0, 0\.15\)\);
    \}

    /\* 로고 이모티콘은 더 큰 효과 \*/
    \.logo \.emoji-3d \{
      font-size: 1\.2em;
      text-shadow:
        3px 3px 6px rgba\(0, 0, 0, 0\.2\),
        -2px -2px 3px rgba\(255, 255, 255, 0\.8\),
        0 0 12px rgba\(255, 255, 255, 0\.6\);
    \}
"@

$newCSS = @"
    /* 🎨 파스텔톤 3D 클레이 스타일 이모티콘 (강화 버전) */
    .emoji-3d {
      display: inline-block;
      font-style: normal;
      /* 3D 입체감 - 다층 그림자 */
      text-shadow:
        3px 3px 8px rgba(0, 0, 0, 0.25),
        -2px -2px 4px rgba(255, 255, 255, 0.9),
        0 0 15px rgba(255, 255, 255, 0.7),
        1px 1px 2px rgba(0, 0, 0, 0.1);
      /* 파스텔톤 필터 */
      filter:
        brightness(1.2)
        saturate(0.75)
        contrast(1.05)
        drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))
        drop-shadow(0 0 12px rgba(255, 255, 255, 0.5));
      transform: translateZ(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      /* 둥근 클레이 느낌 */
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 60%);
      border-radius: 50%;
      padding: 0.15em;
      position: relative;
    }

    .emoji-3d::before {
      content: '';
      position: absolute;
      top: -10%;
      left: -10%;
      right: -10%;
      bottom: -10%;
      background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4), transparent 50%);
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.6;
    }

    .emoji-3d:hover {
      transform: translateY(-3px) scale(1.08) rotateZ(-2deg);
      filter:
        brightness(1.25)
        saturate(0.85)
        contrast(1.1)
        drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))
        drop-shadow(0 0 20px rgba(255, 255, 255, 0.6));
      text-shadow:
        4px 4px 10px rgba(0, 0, 0, 0.3),
        -3px -3px 6px rgba(255, 255, 255, 1),
        0 0 20px rgba(255, 255, 255, 0.8);
    }

    /* 로고 이모티콘 - 더욱 강력한 효과 */
    .logo .emoji-3d {
      font-size: 1.3em;
      text-shadow:
        4px 4px 10px rgba(0, 0, 0, 0.3),
        -3px -3px 5px rgba(255, 255, 255, 1),
        0 0 20px rgba(255, 255, 255, 0.8),
        2px 2px 4px rgba(0, 0, 0, 0.15);
      filter:
        brightness(1.25)
        saturate(0.7)
        contrast(1.1)
        drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
    }

    .logo .emoji-3d:hover {
      transform: translateY(-4px) scale(1.12) rotateZ(-3deg);
      filter:
        brightness(1.3)
        saturate(0.8)
        contrast(1.15)
        drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
    }
"@

$count = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            $newContent = $content -replace '(?s)    /\* 파스텔톤 3D 클레이 스타일 이모티콘 \*/.*?\.logo \.emoji-3d \{[^}]+\}', $newCSS

            if ($content -ne $newContent) {
                Set-Content $file $newContent -Encoding UTF8 -NoNewline
                Write-Host "✓ $file" -ForegroundColor Green
                $count++
            } else {
                Write-Host "- $file (no change)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "✗ $file : $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n완료: $count 개 파일 처리됨" -ForegroundColor Cyan
