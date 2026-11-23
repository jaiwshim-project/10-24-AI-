# AI 고객 롤플레이 시스템

## 📋 개요

**roleplay-sales.html**에 AI가 고객 역할을 맡아 실시간 대화를 진행하는 시스템을 구축했습니다.

## ✨ 주요 기능

### 1. 실시간 음성 대화 시스템
- **Web Speech API** 기반 음성 인식 (STT)
- **Speech Synthesis API** 기반 음성 합성 (TTS)
- **30개 언어 지원** (한국어, 영어, 중국어, 일본어 등)
- 실시간 대화 턴 추적 및 기록

### 2. AI 고객 페르소나 시스템
5가지 시나리오별 AI 고객 페르소나:

#### Scenario 1: 신규 고객 발굴
- **이름**: 김준호 팀장
- **역할**: 구매팀장
- **성격**: 바쁘고 회의적, 직설적
- **오프닝**: "저희는 이미 3개 업체와 거래하고 있는데, 특별히 달라지는 게 있을까요?"

#### Scenario 2: 니즈 파악
- **이름**: 박서영 본부장
- **역할**: IT 본부장
- **성격**: 논리적, 데이터 기반 의사결정
- **오프닝**: "현재 시스템도 나쁘지 않은데, 굳이 바꿔야 할 이유가 있을까요?"

#### Scenario 3: 가치 제안
- **이름**: 최민수 대표
- **역할**: 중소기업 대표
- **성격**: ROI 중시, 사례와 증거 요구
- **오프닝**: "솔직히 예산이 빠듯한데, 이게 정말 투자할 가치가 있나요?"

#### Scenario 4: 반론 처리
- **이름**: 이재현 부장
- **역할**: 재계약 담당 부장
- **성격**: 가격 민감, 협상력 강함
- **오프닝**: "경쟁사가 20% 저렴하게 제안했는데, 왜 계속 여러분과 해야 하죠?"

#### Scenario 5: 클로징
- **이름**: 정수진 이사
- **역할**: 최종 의사결정자
- **성격**: 신중함, 리스크 최소화
- **오프닝**: "제안은 좋은데, 실행 단계로 가기 전에 몇 가지 확인이 필요합니다."

### 3. SPIN Selling 프레임워크 자동 분석
사용자의 질문을 실시간으로 분석하여 SPIN 4단계 체크:
- **S**ituation: 현재 상황 파악 질문
- **P**roblem: 문제점 발견 질문
- **I**mplication: 파급효과 확대 질문
- **N**eed-Payoff: 해결책 가치 인식 질문

### 4. 실시간 AI 코칭
대화 중 실시간으로 코칭 팁 제공:
- SPIN 단계별 안내
- 다음 질문 방향 제시
- 대화 전략 조언

### 5. 대화 기록 및 분석
- 전체 대화 턴 저장
- 타임스탬프 기록
- SPIN 체크리스트 완료도
- feedback.html로 자동 전달

## 🎯 사용 흐름

### STEP 1-1: 사례 선택
- 15개 실전 B2B 영업 사례 중 선택
- 난이도: ⭐⭐⭐ (초급) ~ ⭐⭐⭐⭐⭐+ (최고급)
- 검색 및 난이도 필터 기능

### STEP 1-2: 시나리오 선택
- 5개 시나리오 중 선택:
  1. 🔍 신규 고객 발굴
  2. ❓ 니즈 파악
  3. 💎 가치 제안
  4. 🛡️ 반론 처리
  5. ✅ 클로징

### STEP 2: AI 고객과 실시간 대화
1. **대화 시작**: 마이크 버튼 클릭
2. **AI 첫 인사**: AI 고객이 먼저 말을 걸음
3. **음성 인식**: 사용자 말을 자동 인식
4. **AI 응답**: 시나리오별 페르소나에 맞는 응답
5. **실시간 코칭**: SPIN 체크리스트 + 코칭 팁
6. **대화 종료**: "대화 종료" 버튼 클릭

### STEP 3: AI 분석
- 대화 데이터를 `feedback.html`로 전달
- SPIN 준수도, 설득력, 필러 워드 분석
- 개선 포인트 및 코칭 피드백 제공

## 🔧 기술 스택

### Frontend
- **HTML5** + **CSS3** (파스텔톤 3D 클레이 스타일)
- **Vanilla JavaScript** (ES6+)
- **Web Speech API** (STT/TTS)
- **LocalStorage** (세션 데이터 저장)

### AI 응답 시스템
현재 버전: **룰 기반 응답** (시뮬레이션)
- 시나리오별 패턴 매칭
- 키워드 기반 응답 생성

향후 업그레이드:
- **Claude API** 통합
- 실시간 AI 생성 응답
- 감정 분석 및 적응형 페르소나

## 📊 데이터 구조

### conversationState
```javascript
{
  isActive: false,           // 대화 활성 상태
  isPaused: false,           // 일시정지 상태
  turns: [],                 // 대화 턴 배열
  startTime: null,           // 시작 시간
  aiPersona: null,           // AI 페르소나
  spinChecklist: {           // SPIN 체크리스트
    S: false,
    P: false,
    I: false,
    N: false
  },
  currentMood: 'neutral'     // AI 감정 상태
}
```

### 대화 턴 데이터
```javascript
{
  speaker: 'user' | 'ai',    // 발화자
  message: 'string',         // 메시지 내용
  timestamp: 'ISO 8601'      // 타임스탬프
}
```

### 저장 데이터 (Storage)
```javascript
{
  category: 'sales',         // 카테고리
  case: 'case1',             // 선택한 사례
  scenario: 'scenario1',     // 선택한 시나리오
  duration: '05:32',         // 대화 시간
  turns: [...],              // 전체 대화 턴
  spinChecklist: {...},      // SPIN 완료도
  sessionId: 'uuid',         // 세션 ID
  language: 'ko'             // 사용 언어
}
```

## 🎨 UI/UX 특징

### 1. 대화 히스토리
- 왼쪽: AI 고객 메시지 (오렌지 테마)
- 오른쪽: 사용자 메시지 (블루 테마)
- 타임스탬프 표시
- 자동 스크롤
- 애니메이션 효과

### 2. 실시간 대시보드
- 대화 시간 타이머
- 대화 턴 카운트
- SPIN 체크리스트 (실시간 업데이트)
- AI 코칭 팁 (동적 변경)

### 3. AI 고객 카드
- 프로필 사진 (아이콘)
- 이름 + 역할
- 현재 감정 상태

### 4. 컨트롤 패널
- 🎤 대화 시작/중지
- ⏸️ 일시정지/재개
- ✅ 대화 종료
- ← 시나리오 재선택

## 🌐 다국어 지원

30개 언어 지원:
- 🇰🇷 한국어 (기본)
- 🇺🇸 English
- 🇨🇳 简体中文
- 🇹🇼 繁體中文
- 🇯🇵 日本語
- 🇪🇸 Español
- 🇫🇷 Français
- 🇩🇪 Deutsch
- ... 외 22개 언어

## 🚀 향후 개선 사항

### 1. Claude API 통합 (최우선)
- 룰 기반 → AI 생성 응답
- 컨텍스트 기반 자연스러운 대화
- 사용자 발화 분석 강화

### 2. 감정 분석 시스템
- AI 고객의 감정 상태 추적
- 긍정/중립/부정 3단계
- 사용자 발화에 따라 감정 변화

### 3. 피드백 시스템 강화
- SPIN 준수도 세부 분석
- 필러 워드 검출
- 설득력 점수화
- 개선 포인트 구체화

### 4. 사례 데이터베이스 확장
- 현재 15개 → 50개 이상
- 산업별 특화 사례
- 난이도 세분화

### 5. 멀티 플레이어 모드
- 1:다수 협상 시뮬레이션
- 팀원과 함께 롤플레이
- 실시간 협업 기능

## 📝 파일 구조

```
C:\01 클로드코드\10-24 롤코치AI - RoleCoach AI\
├── roleplay-sales.html        # 메인 페이지 (AI 대화 시스템)
├── feedback.html               # 피드백 분석 페이지
├── js/
│   └── common.js              # 공통 JS (Storage, Session 등)
├── css/
│   └── styles.css             # 공통 스타일
└── AI-CUSTOMER-ROLEPLAY.md    # 이 문서
```

## 🔍 주요 함수

### 대화 제어
- `startConversation()` - 대화 시작
- `stopConversation()` - 대화 중지
- `pauseConversation()` - 일시정지/재개
- `endConversation()` - 대화 종료 및 분석 시작

### 메시지 처리
- `addAIMessage(message)` - AI 메시지 추가 + TTS
- `addUserMessage(message)` - 사용자 메시지 추가
- `generateAIResponse(userMessage)` - AI 응답 생성

### 음성 처리
- `startSpeechRecognition()` - STT 시작
- `stopSpeechRecognition()` - STT 중지
- `getVoiceLanguage(lang)` - 언어별 음성 코드 반환

### 분석
- `analyzeSPINQuestion(message)` - SPIN 질문 분석
- `updateSPINCheckbox(id, checked)` - 체크리스트 업데이트
- `updateCoachingTip(tip)` - 코칭 팁 업데이트

## 📌 참고사항

### 브라우저 호환성
- **Chrome/Edge** 권장 (Web Speech API 완벽 지원)
- Firefox: 부분 지원 (STT만 가능, TTS 제한적)
- Safari: 제한적 지원

### 마이크 권한
- 첫 실행 시 마이크 권한 요청
- HTTPS 환경 필수 (또는 localhost)

### 언어 설정
- localStorage에 저장
- 페이지 새로고침 시 유지
- AI TTS/STT 언어 자동 변경

## 🎓 교육 효과

### 1. SPIN Selling 마스터
- 실전 연습을 통한 프레임워크 체득
- 실시간 피드백으로 즉각 개선
- 단계별 체크리스트로 누락 방지

### 2. 반론 처리 능력 향상
- 다양한 반론 패턴 경험
- 시나리오별 대응 전략 습득
- 실전 감각 향상

### 3. 클로징 스킬 강화
- 의사결정자 설득 연습
- 리스크 관리 및 보장 제시
- 최종 합의 도출 능력

### 4. 자기 분석 능력
- 녹음 재생 및 복기
- SPIN 체크리스트 확인
- 개선 포인트 명확화

## 📞 문의

**심재우**
- Email: jaiwshim@gmail.com
- Project: RoleCoach AI
- Version: 2.0 (AI Customer Roleplay)

---

© 2026 RoleCoach AI. All rights reserved.
