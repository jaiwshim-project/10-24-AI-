import assert from 'node:assert/strict';
import handler from '../api/interview.js';

const question = '지원 직무와 가장 관련 있는 문제를 해결한 경험을 말씀해 주세요.';
const posting = '물류 운영 담당자. 주요 업무: 출고 지연 원인 분석, 주문 데이터 품질 개선, 물류 지표 관리.';
const reasoning = '오류가 접수 단계에 몰린다는 기록을 보고 출고 후 수정 대신 접수 단계 검증을 선택했습니다.';
const action = '저는 우편번호 필수값 검증 규칙과 테스트 6개를 직접 작성했습니다.';
const numeric = '도입 후 4주 동안 주소 누락으로 인한 지연이 주당 12건에서 4건으로 줄었습니다.';
const qualitative = '도입 후 CS 담당자가 주소 재확인 연락이 눈에 띄게 줄었다고 알려줬습니다. 정확한 건수는 모릅니다.';
const cases = [
  { name: '신입 · 판단 이유 누락', key: 'reasoning', answer: '인턴 때 주문 주소 누락으로 출고가 지연됐습니다. ' + action + ' ' + numeric, questionPattern: /이유|왜|판단|근거/ },
  { name: '경력 · 팀 성과와 본인 기여 구분', key: 'action', answer: reasoning + ' 팀에서 검증을 적용했습니다. ' + numeric, questionPattern: /본인|직접|맡|역할|기여/ },
  { name: '경력 · 결과 누락', key: 'outcome', answer: reasoning + ' ' + action, questionPattern: /결과|변화|어떻게.*변|얼마나|줄|확인/ }
];

async function call(action, answer) {
  const res = { status(code) { this.code = code; return this; }, json(value) { return value; } };
  const data = await handler({method:'POST', body:{
    type:'job', action, language:'ko', scenario:'problem-solving', jobPosting:posting, structured:true,
    turns:[{question,answer}]
  }}, res);
  assert.equal(res.code, 200, data.error);
  return data;
}

if (!process.env.ANTHROPIC_API_KEY) throw new Error('Set ANTHROPIC_API_KEY before running this live test.');

const checks = cases.map(async ({name,key,answer,questionPattern}) => {
  const next = await call('followup', answer);
  assert.match(next.text, questionPattern);
  const report = await call('feedback', answer);
  assert.equal(report.rubric[key].status, 'missing');
  assert.equal(report.rubric[key].quote, '');
  assert(posting.includes(report.rubric.jobFit.requirement));
  for (const evidence of Object.values(report.rubric)) {
    assert(!evidence.quote || answer.includes(evidence.quote));
  }
  console.log(JSON.stringify({name, followup:next.text, ...report}));
});

checks.push((async () => {
  const answer = reasoning + ' ' + action + ' ' + qualitative;
  const report = await call('feedback', answer);
  assert.equal(report.rubric.outcome.status, 'present');
  assert(qualitative.includes(report.rubric.outcome.quote) && report.rubric.outcome.quote);
  assert(posting.includes(report.rubric.jobFit.requirement));
  console.log(JSON.stringify({name:'재답변 · 수치 없는 정성적 결과', ...report}));
})());

const results = await Promise.allSettled(checks);
for (const result of results) {
  if (result.status === 'rejected') {
    console.error(result.reason);
    process.exitCode = 1;
  }
}
