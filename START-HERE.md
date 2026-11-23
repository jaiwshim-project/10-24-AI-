# 🚀 RoleCoach AI 실행 가이드

## ⚡ 빠른 시작 (1분)

### 방법 1: PowerShell 스크립트 (추천) ⭐

1. **파일 탐색기에서 우클릭**
   ```
   START-VERCEL-DEV.ps1 우클릭 → PowerShell에서 실행
   ```

2. **질문에 답변**
   - Set up? → `Y` + Enter
   - Which scope? → Enter (dentalclinicfonder 선택됨)
   - Link to existing? → `N` + Enter
   - Project name? → `rolecoach-ai` + Enter
   - Code directory? → Enter (./ 기본값)

3. **성공 메시지 확인**
   ```
   ✓ Linked to dentalclinicfonder/rolecoach-ai
   > Ready! Available at http://localhost:3000
   ```

4. **Chrome에서 접속**
   ```
   http://localhost:3000/roleplay-hospital-counselor.html
   ```

---

### 방법 2: 수동 터미널 실행

```bash
# 1. 터미널 열기 (Win + R → cmd)
cd "C:\01 클로드코드\10-24 롤코치AI - RoleCoach AI"

# 2. Vercel Dev 실행
npx vercel dev

# 3. 질문에 답변 (위와 동일)
```

---

## 🔑 환경 변수 설정 (필수)

### 1. API 키 발급
```
https://console.anthropic.com/settings/keys
→ "Create Key" 클릭
→ sk-ant-api03-xxxxx 형식의 키 복사
```

### 2. .env.local 파일 수정
```bash
# 메모장으로 열기
notepad .env.local

# 아래 내용 입력 (your-api-key-here를 실제 키로 교체)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### 3. Vercel Dev 재시작
```bash
# Ctrl + C로 중지
# 다시 실행
npx vercel dev
```

---

## ✅ 정상 작동 확인

### 터미널 출력
```
Vercel CLI 54.7.1
✓ Linked to dentalclinicfonder/rolecoach-ai
> Ready! Available at http://localhost:3000

[API] /api/roleplay-chat (123ms)
[roleplay-chat] Request received: {method: "POST"}
[roleplay-chat] Calling Claude API...
[roleplay-chat] Response generated: 안녕하세요...
```

### 브라우저 콘솔 (F12)
```javascript
[getAIResponse] Sending request: {scenario: "case1", ...}
[getAIResponse] Response status: 200
[getAIResponse] Success: {patientResponse: "..."}
```

---

## 🎯 테스트 시나리오

1. **시나리오 선택**
   - 사례 1: 쌍꺼풀 재수술 (난이도 ⭐⭐⭐⭐⭐)
   - 사례 2: 라식 vs 라섹 (난이도 ⭐⭐⭐)
   - 사례 3: 부모+자녀 교정치료 (난이도 ⭐⭐⭐⭐)

2. **언어 선택**
   - 한국어, 영어, 중국어 등 30개 언어 지원

3. **대화 시작**
   - 🎤 버튼 클릭
   - 마이크 권한 허용
   - AI가 먼저 환자 역할로 인사
   - 음성으로 응답
   - 턴제 대화 자동 전환

---

## 🐛 문제 해결

### "Failed to fetch" 오류
```
원인: Python 서버 등 정적 서버 사용
해결: npx vercel dev 실행 필수
```

### "ANTHROPIC_API_KEY not found" 오류
```
원인: .env.local 파일에 API 키 없음
해결: .env.local 파일 수정 → Vercel Dev 재시작
```

### "Port 3000 is already in use" 오류
```
원인: 다른 프로세스가 3000번 포트 사용 중
해결: npx vercel dev --listen 3001
```

### 마이크 권한 오류
```
원인: 브라우저가 마이크 접근 차단
해결: 주소창 왼쪽 자물쇠 → 사이트 설정 → 마이크 허용
```

---

## 📂 주요 파일

- **`START-VERCEL-DEV.ps1`** - PowerShell 실행 스크립트
- **`QUICK-START.md`** - 빠른 시작 가이드
- **`TEST-GUIDE.md`** - 테스트 시나리오
- **`DEPLOYMENT.md`** - 배포 가이드
- **`.env.local`** - 환경 변수 (API 키)

---

## 🚀 프로덕션 배포

### Vercel 대시보드 설정
```
https://vercel.com/dashboard
→ 프로젝트 선택
→ Settings → Environment Variables
→ ANTHROPIC_API_KEY 추가
```

### Git Push
```bash
git add .
git commit -m "음성 대화 기능 완성"
git push origin master
```

Vercel이 자동으로 배포합니다 (1-2분).

---

## 📞 도움이 필요하면

1. **브라우저 콘솔** (F12) 스크린샷
2. **터미널 로그** 스크린샷
3. **.env.local 파일** 확인 (API 키는 숨기고)

위 3가지를 확인하면 정확한 원인 파악이 가능합니다.

---

**© 2026 RoleCoach AI. All rights reserved.**
**심재우 <jaiwshim@gmail.com>**
