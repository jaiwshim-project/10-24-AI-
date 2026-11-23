# 🚀 실시간 음성 대화 기능 배포 가이드

## ✅ 구현 완료 기능

### 1. **실시간 음성 대화 시스템**
- **음성 인식**: Web Speech API로 사용자 음성 → 텍스트 변환
- **AI 환자 역할**: Claude API로 환자 응답 생성
- **음성 합성**: Web Speech API TTS로 AI 응답 음성 재생
- **턴제 대화**: 사용자 말 → AI 응답 → 사용자 말 자동 전환

### 2. **대화 관리**
- 대화 기록 누적 (컨텍스트 유지)
- 실시간 대화 내역 표시 (채팅 UI)
- 시나리오별 환자 캐릭터 (3가지 사례)
- 30개 언어 지원

---

## 🔧 Vercel 환경 변수 설정 (필수)

배포 전에 Vercel 대시보드에서 환경 변수를 추가해야 합니다.

### 방법 1: Vercel 대시보드
1. https://vercel.com/dashboard 로그인
2. 프로젝트 선택 → Settings → Environment Variables
3. 아래 환경 변수 추가:

```bash
ANTHROPIC_API_KEY = sk-ant-api03-xxxxx
```

### 방법 2: Vercel CLI
```bash
# Vercel CLI 설치
npm install -g vercel

# 환경 변수 추가
vercel env add ANTHROPIC_API_KEY

# 값 입력: sk-ant-api03-xxxxx
# Environment: Production, Preview, Development 모두 선택
```

---

## 📦 배포 방법

### 1. Git Push & Vercel 자동 배포
```bash
git add .
git commit -m "실시간 음성 대화 기능 추가 - AI 환자 역할, 음성 인식/합성"
git push origin master
```

Vercel이 자동으로 배포합니다.

### 2. Vercel CLI 배포
```bash
vercel --prod
```

---

## 🧪 로컬 테스트

### 1. 환경 변수 설정
`.env.local` 파일 생성:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### 2. 개발 서버 실행
```bash
vercel dev
```

### 3. 테스트
1. http://localhost:3000/roleplay-hospital-counselor.html 접속
2. 시나리오 선택 (사례 1, 2, 3 중)
3. 🎤 버튼 클릭
4. 마이크 권한 허용
5. AI가 먼저 인사함 (음성)
6. 사용자가 음성으로 응답
7. AI가 환자 역할로 음성 응답

---

## 🎯 사용 흐름

### STEP 1: 시나리오 선택
- **사례 1**: 1,200만원 쌍꺼풀 재수술 (난이도: ⭐⭐⭐⭐⭐)
- **사례 2**: 라식 vs 라섹 우유부단 환자 (난이도: ⭐⭐⭐)
- **사례 3**: 부모+자녀 교정치료 상담 (난이도: ⭐⭐⭐⭐)

### STEP 2: 실시간 대화
1. 🎤 버튼 클릭 → 대화 시작
2. AI가 먼저 환자 역할로 인사 (음성)
3. 사용자가 상담실장 역할로 응답 (음성)
4. AI가 환자로 응답 (음성)
5. 턴제 대화 반복
6. 다시 🎤 버튼 클릭 → 대화 종료

### STEP 3: 분석
- "분석 시작" 버튼 클릭
- feedback.html로 이동
- 스피치 메트릭, 필러 워드, 프레임워크 준수도 분석

---

## 🛠️ 기술 스택

### Frontend
- **Web Speech API (Speech Recognition)**: 음성 → 텍스트
- **Web Speech API (Speech Synthesis)**: 텍스트 → 음성
- **JavaScript**: 실시간 대화 관리

### Backend
- **Vercel Serverless Functions**: `/api/roleplay-chat.js`
- **Claude Sonnet 4**: 환자 역할 AI
- **Context Management**: 대화 히스토리 누적

---

## 📊 API 사용량 예측

### Claude API 비용
- **모델**: claude-sonnet-4-20250514
- **토큰/응답**: 평균 100-200 토큰
- **가격**: $3 / 1M input tokens, $15 / 1M output tokens
- **예상 비용**: 1회 대화(10턴) = 약 $0.03

### 월 비용 예측
- 100명 사용자 × 10회/월 × 10턴/회 = 10,000턴
- 10,000턴 × $0.003/턴 = **$30/월**

---

## 🐛 트러블슈팅

### 1. 음성 인식이 안 됨
**원인**: Chrome 브라우저가 아니거나 HTTPS가 아님
**해결**: Chrome 사용 + HTTPS 배포 (Vercel은 자동 HTTPS)

### 2. 마이크 권한 오류
**원인**: 브라우저가 마이크 접근을 차단
**해결**: 브라우저 주소창 왼쪽 자물쇠 → 사이트 설정 → 마이크 허용

### 3. AI 응답이 느림
**원인**: Claude API 네트워크 지연
**해결**: "AI가 생각하는 중..." 상태 표시로 UX 개선 (이미 구현됨)

### 4. 음성 합성 음질 불량
**원인**: 브라우저 기본 TTS 엔진 사용
**개선**: ElevenLabs API 같은 프리미엄 TTS 사용 (비용 추가)

### 5. 대화 컨텍스트 유실
**원인**: `conversationHistory` 배열이 초기화됨
**확인**: 콘솔에서 `conversationHistory` 출력해서 확인

---

## 🚀 다음 개선 사항

### Phase 2: 고급 기능
1. **대화 녹음 저장**: 음성 파일 저장 (Supabase Storage)
2. **프리미엄 TTS**: ElevenLabs API로 자연스러운 음성
3. **실시간 피드백**: 대화 중 "좋은 질문이에요!" 같은 실시간 힌트
4. **멀티 턴 전략**: 프레임워크 5단계 진행도 실시간 표시

### Phase 3: 데이터 분석
1. **대화 전사록 저장**: Whisper API로 정확한 텍스트 추출
2. **감정 분석**: 사용자 음성의 톤, 속도, 감정 분석
3. **통계 대시보드**: 평균 대화 시간, 완료율, 난이도별 성공률

---

## 📝 파일 구조

```
/api/roleplay-chat.js          # Claude API 호출 (환자 역할 생성)
/roleplay-hospital-counselor.html  # 실시간 대화 UI
/js/common.js                   # 공통 함수 (Session, Toast 등)
/feedback.html                  # 분석 결과 페이지
DEPLOYMENT.md                   # 이 파일
```

---

## ✅ 체크리스트

배포 전 확인:
- [ ] Vercel 환경 변수 `ANTHROPIC_API_KEY` 설정
- [ ] Chrome 브라우저에서 로컬 테스트 완료
- [ ] 마이크 권한 허용 확인
- [ ] 3가지 시나리오 모두 테스트
- [ ] 한국어, 영어 모두 테스트
- [ ] 대화 로그 표시 확인
- [ ] "분석 시작" 버튼 동작 확인

배포 후 확인:
- [ ] HTTPS로 접속 가능
- [ ] 음성 인식 동작
- [ ] AI 응답 생성
- [ ] 음성 합성 재생
- [ ] 대화 기록 표시
- [ ] 언어 전환 동작

---

## 📞 지원

문제 발생 시:
1. 브라우저 콘솔(F12) 확인
2. Vercel 로그 확인: https://vercel.com/dashboard → 프로젝트 → Deployments → Logs
3. Claude API 사용량 확인: https://console.anthropic.com/

---

**© 2026 RoleCoach AI. All rights reserved.**
**심재우 <jaiwshim@gmail.com>**
