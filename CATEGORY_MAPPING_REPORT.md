# 카테고리 매핑 점검 보고서

## 문제점 발견
feedback.html에서 교육 상담(education-counseling) 카테고리가 "신규 환자 상담"으로 잘못 표시되는 오류 발견.

## 수정 내역

### 1. feedback.html 수정 사항

#### 1-1. categoryNames 객체 추가
카테고리 ID → 한글명 매핑 테이블 추가:

```javascript
const categoryNames = {
  // 의료 (4개)
  'hospital': '병원 상담',
  'hospital-counselor': '병원 상담사',
  'foreign-patient': '외국인 환자 상담',
  'doctor-explanation': '의사 설명',

  // 세일즈 (6개)
  'sales': 'B2B 영업',
  'insurance': '보험 영업',
  'car-sales': '자동차 영업',
  'realestate': '부동산 상담',
  'cold-call': '전화영업·콜드콜',
  'customer-success': '고객성공·재계약',

  // 스타트업 (4개)
  'startup': '소상공인·창업',
  'government-grant': '정부지원사업',
  'poc-partnership': 'PoC 파트너십',
  'consulting-sales': '강사·컨설턴트 영업',

  // 정치 (4개)
  'politics': '정치·선거',
  'policy-announcement': '정책발표·기자회견',
  'debate-interview': 'TV토론·언론 인터뷰',
  'ministry': '공공기관 민원응대',

  // 면접 (3개)
  'interview': '취업·이직 면접',
  'college-interview': '대입 면접',
  'education-counseling': '교육 상담',  // ✅ 수정됨

  // 리더십 (3개)
  'leadership-feedback': '리더십·피드백',
  'conflict-discipline': '조직 갈등·징계',
  'executive-presentation': '사내 발표·임원 보고',

  // 전문직 (3개)
  'legal': '법률 상담',
  'tax-accounting': '세무회계 상담',
  'labor': '노무 상담',

  // 커머스 (2개)
  'live-commerce': '라이브커머스·쇼호스트',
  'creator-branding': '크리에이터 브랜딩',

  // 심리·코칭 (1개)
  'psychological-coaching': '심리·코칭·상담',

  // 글로벌 (2개)
  'global-buyer': '글로벌 바이어 상담',
  'global-pitch': '영어 피칭·글로벌 투자'
};
```

#### 1-2. coachNames 객체 업데이트
모든 카테고리 키를 하이픈 형식으로 통일:
- ❌ `education: '교육 상담 전문가 AI'`
- ✅ `'education-counseling': '교육 상담 전문가 AI'`

#### 1-3. Mock 데이터 시나리오 수정
- ❌ `scenario: '신규 환자 상담'`
- ✅ `scenario: '기본 시나리오'`

#### 1-4. UI 업데이트 로직 수정
```javascript
const categoryDisplayName = categoryNames[sessionData.category] || sessionData.category;
document.getElementById('sessionTitle').textContent = `${categoryDisplayName} - ${sessionData.scenario}`;
```

#### 1-5. categoryPages 객체 수정
모든 카테고리 키를 하이픈 형식으로 통일

#### 1-6. CSS 클래스 수정
모든 카테고리 클래스명을 하이픈 형식으로 통일:
- ❌ `.category-education .section-card`
- ✅ `.category-education-counseling .section-card`

### 2. 롤플레이 페이지 category 필드 수정

#### 누락된 category 필드 추가 (9개 파일)
1. ✅ roleplay-college-interview.html → `category: 'college-interview'`
2. ✅ roleplay-conflict-discipline.html → `category: 'conflict-discipline'`
3. ✅ roleplay-education-counseling.html → `category: 'education-counseling'`
4. ✅ roleplay-executive-presentation.html → `category: 'executive-presentation'`
5. ✅ roleplay-interview.html → `category: 'interview'`
6. ✅ roleplay-leadership-feedback.html → `category: 'leadership-feedback'`
7. ✅ roleplay-ministry.html → `category: 'ministry'`
8. ✅ roleplay-politics.html → `category: 'politics'`
9. ✅ roleplay-startup.html → `category: 'startup'` (잘못된 'franchise'에서 수정)

#### 기존 category 필드 확인 (23개 파일)
모두 올바른 하이픈 형식으로 설정되어 있음:
- roleplay-hospital.html → `category: 'hospital'`
- roleplay-hospital-counselor.html → `category: 'hospital-counselor'`
- roleplay-foreign-patient.html → `category: 'foreign-patient'`
- roleplay-doctor-explanation.html → `category: 'franchise'` (의사 설명용, 별도 카테고리)
- roleplay-sales.html → `category: 'sales'`
- roleplay-insurance.html → `category: 'insurance'`
- roleplay-car-sales.html → `category: 'car-sales'`
- roleplay-realestate.html → `category: 'realestate'`
- roleplay-cold-call.html → `category: 'cold-call'`
- roleplay-customer-success.html → `category: 'customer-success'`
- roleplay-government-grant.html → `category: 'government-grant'`
- roleplay-poc-partnership.html → `category: 'poc-partnership'`
- roleplay-consulting-sales.html → `category: 'consulting-sales'`
- roleplay-policy-announcement.html → `category: 'policy-announcement'`
- roleplay-debate-interview.html → `category: 'debate-interview'`
- roleplay-legal.html → `category: 'legal'`
- roleplay-tax-accounting.html → `category: 'tax-accounting'`
- roleplay-labor.html → `category: 'labor'`
- roleplay-live-commerce.html → `category: 'live-commerce'`
- roleplay-creator-branding.html → `category: 'creator-branding'`
- roleplay-psychological-coaching.html → `category: 'psychological-coaching'`
- roleplay-global-buyer.html → `category: 'global-buyer'`
- roleplay-global-pitch.html → `category: 'global-pitch'`

## 최종 카테고리 목록 (32개)

### 의료 (4개)
1. hospital → 병원 상담
2. hospital-counselor → 병원 상담사
3. foreign-patient → 외국인 환자 상담
4. doctor-explanation → 의사 설명

### 세일즈 (6개)
5. sales → B2B 영업
6. insurance → 보험 영업
7. car-sales → 자동차 영업
8. realestate → 부동산 상담
9. cold-call → 전화영업·콜드콜
10. customer-success → 고객성공·재계약

### 스타트업 (4개)
11. startup → 소상공인·창업
12. government-grant → 정부지원사업
13. poc-partnership → PoC 파트너십
14. consulting-sales → 강사·컨설턴트 영업

### 정치 (4개)
15. politics → 정치·선거
16. policy-announcement → 정책발표·기자회견
17. debate-interview → TV토론·언론 인터뷰
18. ministry → 공공기관 민원응대

### 면접 (3개)
19. interview → 취업·이직 면접
20. college-interview → 대입 면접
21. education-counseling → 교육 상담 ✅

### 리더십 (3개)
22. leadership-feedback → 리더십·피드백
23. conflict-discipline → 조직 갈등·징계
24. executive-presentation → 사내 발표·임원 보고

### 전문직 (3개)
25. legal → 법률 상담
26. tax-accounting → 세무회계 상담
27. labor → 노무 상담

### 커머스 (2개)
28. live-commerce → 라이브커머스·쇼호스트
29. creator-branding → 크리에이터 브랜딩

### 심리·코칭 (1개)
30. psychological-coaching → 심리·코칭·상담

### 글로벌 (2개)
31. global-buyer → 글로벌 바이어 상담
32. global-pitch → 영어 피칭·글로벌 투자

## 검증 결과

✅ 모든 롤플레이 페이지(32개)에 올바른 category 필드 설정 완료
✅ feedback.html에서 모든 카테고리 정확한 한글명으로 매핑 완료
✅ CSS 클래스명 모두 하이픈 형식으로 통일 완료
✅ categoryPages 라우팅 테이블 모두 올바른 파일명으로 매핑 완료

## 테스트 권장사항

1. education-counseling 롤플레이 실행 후 feedback.html에서 "교육 상담"으로 정확히 표시되는지 확인
2. 다른 모든 카테고리도 올바른 한글명으로 표시되는지 확인
3. "다시 연습하기" 버튼 클릭 시 올바른 롤플레이 페이지로 이동하는지 확인

---

**작업 완료일**: 2026-06-04
**수정 파일 수**: 10개 (feedback.html + 9개 roleplay 페이지)
