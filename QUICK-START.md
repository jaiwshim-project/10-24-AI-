# 🚀 빠른 시작 가이드 (5분)

## ❌ "AI 응답 실패" 오류 해결

이 오류는 **환경 변수가 설정되지 않아서** 발생합니다.

---

## 1️⃣ API 키 발급 (1분)

1. https://console.anthropic.com/settings/keys 접속
2. "Create Key" 버튼 클릭
3. 생성된 키 복사 (sk-ant-api03-xxxxx 형식)

---

## 2️⃣ 로컬 환경 설정 (1분)

### 방법 A: `.env.local` 파일 수정 (추천)

```bash
# .env.local 파일 열기
notepad .env.local

# 아래 내용 입력 (your-api-key-here를 실제 키로 교체)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### 방법 B: 직접 생성

```bash
# 프로젝트 루트에 .env.local 파일 생성
echo ANTHROPIC_API_KEY=sk-ant-api03-xxxxx > .env.local
```

---

## 3️⃣ 개발 서버 실행 (1분)

```bash
# npm 패키지 설치 (처음만)
npm install

# Vercel Dev 서버 실행
npx vercel dev
```

**출력 예시:**
```
Vercel CLI 33.0.0
> Running dev command: python -m http.server 8000
> Ready! Available at http://localhost:3000
```

---

## 4️⃣ 테스트 (2분)

### Chrome에서 접속
```
http://localhost:3000/roleplay-hospital-counselor.html
```

### 대화 시작
1. **시나리오 선택**: 사례 1, 2, 3 중 하나 클릭
2. **다음 단계** 버튼 클릭
3. **🎤 버튼** 클릭
4. **마이크 권한 허용**
5. AI가 먼저 인사 (음성)
6. 음성으로 응답

---

## ✅ 정상 작동 확인

### 콘솔 로그 (F12)
```
[getAIResponse] Sending request: {scenario: "case1", ...}
[roleplay-chat] Request received: {method: "POST", ...}
[roleplay-chat] Calling Claude API...
[roleplay-chat] Response generated: "안녕하세요..."
[getAIResponse] Success: {patientResponse: "..."}
```

### 화면 표시
- ✅ "🤖 AI가 생각하는 중..." 표시
- ✅ "환자: ..." 메시지 표시
- ✅ AI 음성 재생
- ✅ 대화 내역에 양쪽 메시지 표시

---

## 🐛 여전히 오류 발생 시

### 1. 브라우저 콘솔 확인 (F12)

**에러 유형별 해결책:**

#### "ANTHROPIC_API_KEY not found"
```bash
# .env.local 파일 내용 확인
cat .env.local

# vercel dev 재시작
Ctrl+C
npx vercel dev
```

#### "Failed to fetch"
```bash
# vercel dev가 실행 중인지 확인
# 터미널에 "Ready! Available at http://localhost:3000" 출력 확인

# 포트 3000이 사용 중이라면
npx vercel dev --listen 3001
```

#### "Invalid scenario"
```javascript
// 콘솔에서 selectedScenario 확인
console.log(selectedScenario);

// null이면 시나리오를 선택하지 않은 것
// → STEP 1에서 카드 클릭 → "다음 단계" 버튼
```

#### "API key invalid"
```bash
# API 키가 올바른지 확인
# sk-ant-api03-xxxxx 형식이어야 함
# 복사할 때 공백이나 줄바꿈이 들어가지 않도록 주의
```

### 2. 네트워크 탭 확인

Chrome → F12 → Network 탭 → /api/roleplay-chat 요청 클릭

**Request Payload 확인:**
```json
{
  "scenario": "case1",
  "language": "ko",
  "history": [],
  "counselorMessage": "[대화 시작]"
}
```

**Response 확인:**
```json
// 성공 시
{
  "success": true,
  "patientResponse": "안녕하세요...",
  "usage": {...}
}

// 실패 시
{
  "error": "...",
  "details": "...",
  "apiKeyConfigured": false  // ← 이게 false면 환경 변수 문제
}
```

---

## 📱 모바일/다른 기기에서 테스트

```bash
# Vercel Dev 외부 접속 허용
npx vercel dev --listen 0.0.0.0:3000

# 같은 네트워크의 다른 기기에서 접속
http://192.168.x.x:3000/roleplay-hospital-counselor.html
# (192.168.x.x는 PC의 로컬 IP)
```

---

## 🚀 Vercel 프로덕션 배포

### 1. 환경 변수 설정
```bash
# Vercel 대시보드
https://vercel.com/dashboard

# 프로젝트 → Settings → Environment Variables
Name: ANTHROPIC_API_KEY
Value: sk-ant-api03-xxxxx
Environments: Production, Preview, Development (모두 체크)
```

### 2. Git Push
```bash
git add .
git commit -m "음성 대화 기능 수정"
git push origin master
```

### 3. 배포 확인
```bash
# Vercel이 자동 배포 (1-2분)
# 이메일로 배포 완료 알림

# 프로덕션 테스트
https://your-project.vercel.app/roleplay-hospital-counselor.html
```

---

## 💡 팁

### Chrome 권장
- Safari, Firefox는 Web Speech API 지원이 제한적
- Chrome 또는 Edge 사용 권장

### 마이크 테스트
```
chrome://settings/content/microphone
```
마이크가 제대로 작동하는지 확인

### API 사용량 확인
```
https://console.anthropic.com/
Usage 탭에서 실시간 사용량 확인
```

---

## 📞 여전히 문제가 있다면

1. **브라우저 콘솔 스크린샷** (F12)
2. **Network 탭 스크린샷** (/api/roleplay-chat 요청)
3. **Vercel Dev 터미널 로그**

위 3가지를 확인하면 정확한 원인 파악 가능합니다.

---

**© 2026 RoleCoach AI**
