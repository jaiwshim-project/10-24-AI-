# RoleCoach AI

AI 기반 롤플레이 시뮬레이션을 통한 커뮤니케이션 스킬 향상 플랫폼

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](package.json)

## 프로젝트 개요

**RoleCoach AI**는 병원 상담, 영업 세일즈, 정치 선거, 취업 면접, 스타트업 피칭 등 5개 분야에 특화된 AI 코치가 실시간으로 대화를 진행하고, 사용자의 스피치를 분석하여 정량적 피드백을 제공하는 웹 기반 코칭 플랫폼입니다.

글로벌 1위 스피치 코칭 플랫폼 **Yoodli AI**를 벤치마킹하고, 한국 시장에 특화된 기능(한국어 필러 워드 탐지, 존댓말 분석, SPIN/Insight Selling 통합, 5단계 설득 로드맵)을 추가했습니다.

## 핵심 기능

### 1. 실시간 AI 롤플레이
- AI가 고객, 면접관, 유권자 역할을 하며 실전처럼 대화 진행
- 사용자의 응답에 따라 동적으로 시나리오 변화

### 2. 스피치 메트릭 분석
- 말하기 속도(WPM), 필러 워드 횟수, 톤(자신감/명료도/에너지)
- 프레임워크 준수도 (SPIN, STAR, 5단계 설득 로드맵)

### 3. 전문가 AI 코치
- **병원 상담:** Dr. Michael Unger (환자 커뮤니케이션 전문가)
- **영업 세일즈:** Neil Rackham + Matthew Dixon (SPIN + Insight Selling)
- **정치 선거:** Simon Lancaster (영국 정치 연설 작가)
- **취업 면접:** Gayle McDowell (Google/Microsoft 면접관)
- **스타트업 피칭:** Jason Calacanis (엔젤투자자)

### 4. 한국어 특화 기능
- 한국어 필러 워드 탐지: "어", "음", "저기", "그러니까" 등
- 존댓말 일관성 분석: 비즈니스 상황별 높임법 준수도 평가

### 5. 녹음 & 재생
- 세션을 녹음하여 반복 청취 및 자가 평가

### 6. 학습 대시보드
- 개인별 학습 이력, 분야별 평균 점수, 점수 진행 추이 시각화

## 기술 스택

- **Frontend:** HTML5, CSS3 (Premium White Theme), Vanilla JavaScript (ES6+)
- **AI API:** Google Gemini API (스피치 분석, 롤플레이 대화 생성)
- **로컬 스토리지:** LocalStorage (세션 관리, 학습 이력 저장)
- **녹음:** Web Audio API (MediaRecorder, getUserMedia)
- **차트:** Canvas 2D API (분야별 성과, 진행 추이 시각화)

## 프로젝트 구조

```
RoleCoach AI/
├── index.html                    # 메인 페이지 (분야 선택)
├── dashboard.html                # 학습 대시보드
├── manual.html                   # 사용 매뉴얼
├── copyright.html                # 저작권 등록 자료
├── roleplay-hospital.html        # 병원 상담 롤플레이
├── roleplay-sales.html           # 영업 세일즈 롤플레이
├── roleplay-politics.html        # 정치 선거 롤플레이
├── roleplay-interview.html       # 취업 면접 롤플레이
├── roleplay-startup.html         # 스타트업 피칭 롤플레이
├── feedback.html                 # AI 피드백 분석 페이지
├── css/
│   └── styles.css                # Premium White Theme CSS
├── js/
│   └── common.js                 # 세션 관리, 녹음, 스피치 분석, 유틸리티
└── README.md                     # 본 문서
```

## 설치 및 실행

### 1. 필수 요구사항
- 웹 브라우저 (Chrome, Edge, Safari 최신 버전)
- 마이크 권한 허용
- 인터넷 연결 (Gemini API 호출용)

### 2. 로컬 실행
```bash
# 1. 저장소 클론
git clone <repository-url>
cd rolecoach-ai

# 2. 웹 서버 실행 (Live Server 또는 Python HTTP Server)
# Live Server (VSCode 확장) 사용 시
# index.html 우클릭 → Open with Live Server

# 또는 Python HTTP Server
python -m http.server 8000

# 3. 브라우저에서 접속
# http://localhost:8000
```

### 3. Gemini API 키 설정
```javascript
// js/common.js 파일 수정
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

**API 키 발급:** [Google AI Studio](https://aistudio.google.com/app/apikey)

## 사용 방법

### 1. 분야 선택
- 메인 페이지에서 5개 분야 중 하나 선택
  - 병원 상담 / 영업 세일즈 / 정치 선거 / 취업 면접 / 스타트업 피칭

### 2. 시나리오 선택
- 각 분야별 4가지 시나리오 중 선택
- 예: 병원 상담 → "신규 환자 상담"

### 3. 롤플레이 진행
- [🎙️ 녹음 시작] 버튼 클릭
- AI와 실시간 대화 진행
- 프레임워크에 맞춰 질문 및 응답

### 4. 피드백 확인
- [⏹️ 세션 종료] 버튼 클릭
- AI가 스피치 분석 수행 (약 2초)
- 점수, 개선점, 상세 분석 확인

### 5. 대시보드 조회
- 상단 메뉴에서 [대시보드] 클릭
- 통계, 최근 세션, 분야별 차트 확인

## 독창적 요소

### 1. 한국어 필러 워드 탐지 시스템
- 기존 글로벌 도구는 영어 필러 워드("uh", "um")만 탐지
- RoleCoach AI는 한국어 특화 필러 워드 정확 탐지 + 타임스탬프 제공

### 2. 존댓말 일관성 분석
- 한국어 경어법 규칙 + AI 학습을 결합한 실시간 존댓말 분석 엔진

### 3. SPIN/Insight Selling 통합 프레임워크
- Neil Rackham의 SPIN Selling + Matthew Dixon의 Insight Selling 통합
- 한국 시장에 맞게 재구성한 하이브리드 모델

### 4. 5단계 설득 로드맵 (병원 상담 전용)
- 치과병원 상담 현장에서 검증된 프로세스를 AI 코칭 시스템으로 구현
- 공감 형성 → 문제 인식 → 해결책 제시 → 신뢰 구축 → 행동 유도

### 5. 분야별 AI 코치 페르소나
- 세계적 전문가를 모델로 한 AI 페르소나
- 전문가의 저서, 인터뷰, 강연 내용을 분석하여 AI 프롬프트로 재구성

### 6. 서버리스 클라이언트 전용 아키텍처
- 백엔드 서버 없이 클라이언트 사이드에서 모든 기능 구현
- 인프라 비용 제로로 무제한 확장 가능

## 데이터 흐름

```
사용자 → 분야 선택 → 롤플레이 시작 → 음성 녹음
   ↓
Gemini API 호출 (음성→텍스트 변환 + AI 응답 생성)
   ↓
스피치 분석 (필러 워드, 속도, 톤, 프레임워크 준수도)
   ↓
피드백 표시 + LocalStorage 저장
   ↓
대시보드에서 통계 및 차트 시각화
```

## 라이선스

이 프로그램은 **독점 저작물(Proprietary Software)**입니다.  
저작권자의 명시적 서면 허가 없이 복제, 수정, 배포, 재사용할 수 없습니다.

- ❌ 무단 복제 금지
- ❌ 무단 수정 금지
- ❌ 무단 배포 금지
- ❌ 무단 상업적 이용 금지
- ✅ 저작권자의 서면 허가 시에만 이용 가능

## 저작권

**© 2026 RoleCoach AI. All rights reserved.**

- **저작권자:** 심재우 (Jae Woo Shim)
- **이메일:** jaiwshim@gmail.com
- **국적:** 대한민국
- **창작일자:** 2026년 3월 14일
- **공표일자:** 2026년 3월 14일

자세한 저작권 정보는 [copyright.html](copyright.html) 참조

## 문서

- [사용 매뉴얼](manual.html): 기능 설명, FAQ, 활용 가이드
- [저작권 등록 자료](copyright.html): 프로그램 개요, 기능 명세, 시스템 구조, 독창적 요소, 창작 이력

## 버전 히스토리

### v1.0.0 (2026-03-14)
- 초기 릴리스
- 5개 분야 롤플레이 시뮬레이션
- 스피치 분석 엔진 (Gemini API 연동)
- 학습 대시보드 및 통계 시각화
- 한국어 필러 워드 탐지
- 존댓말 일관성 분석
- SPIN/Insight Selling 통합
- 5단계 설득 로드맵 (병원 상담)

## 문의

- **이메일:** jaiwshim@gmail.com
- **제목:** [RoleCoach AI] 문의 내용

---

**RoleCoach AI** - AI와 함께하는 실전 커뮤니케이션 훈련
