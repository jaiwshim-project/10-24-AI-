import { randomInt } from 'node:crypto';

const questions = {
  engineering: [
    '배포 직전에 테스트 결과가 서로 다르게 나왔던 경험을 말씀해 주세요. 무엇을 확인하고 어떻게 대응했나요?',
    '장애 보고의 원인이 처음 예상과 달랐던 경험을 말씀해 주세요. 어떤 순서로 문제를 풀었나요?'
  ],
  operations: [
    '여러 요청이 한꺼번에 밀려 처리 순서를 바꿔야 했던 경험을 말씀해 주세요. 어떻게 대응했나요?',
    '담당자가 바뀐 뒤 업무 인계에서 문제가 생긴 경험을 말씀해 주세요. 무엇을 바꾸었나요?'
  ],
  sales: [
    '고객이 처음 말한 요구와 실제로 필요로 한 것이 달랐던 경험을 말씀해 주세요. 그 차이를 어떻게 풀었나요?',
    '고객이 제안에 동의한 뒤 실행 단계에서 주저했던 경험을 말씀해 주세요. 어떻게 대응했나요?'
  ],
  product: [
    '이해관계자마다 다른 방향을 요구했던 프로젝트를 말씀해 주세요. 결정을 어떻게 내렸나요?',
    '기획 초기에 세운 가정이 사용자 반응과 달랐던 경험을 말씀해 주세요. 이후 무엇을 바꾸었나요?'
  ],
  general: [
    '업무나 프로젝트의 진행 방식이 갑자기 바뀌었던 경험을 말씀해 주세요. 그때 어떻게 대응했나요?',
    '주변 사람이 미처 알아차리지 못한 문제를 먼저 발견한 경험을 말씀해 주세요. 어떻게 해결했나요?'
  ]
};

export const isInterviewRole = role => typeof role === 'string' && Object.hasOwn(questions, role);

export function selectOpeningQuestion(role, previousQuestion) {
  const options = questions[role].filter(question => question !== previousQuestion);
  return options[randomInt(options.length)];
}
