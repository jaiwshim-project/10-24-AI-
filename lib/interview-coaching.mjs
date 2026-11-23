export const coachingCriteria = {
  reasoning: 'Why the candidate chose the approach. A problem or solution on its own is insufficient.',
  action: 'A decision or action explicitly performed by the candidate. A team action on its own is insufficient.',
  outcome: 'A specific observed change after the intervention. A goal or completed implementation is insufficient. Qualitative changes count.',
  problem: 'The concrete problem and its constraint, scope or impact.',
  verification: 'How the stated outcome was checked. A named record, comparison method, firsthand observation or a named role reporting a specific change counts. A number on its own is insufficient. The source must relate to the same outcome.',
  transfer: 'How the candidate would apply a lesson or approach from this experience to a specific task in their target role. A generic claim of relevance is insufficient.'
};

const questions = {
  reasoning: '그 해결 방법을 선택한 이유는 무엇인가요?',
  action: '그 과정에서 본인이 직접 결정하거나 실행한 일은 무엇인가요?',
  outcome: '그 조치를 한 뒤 실제로 무엇이 달라졌나요?',
  problem: '당시 해결해야 했던 문제와 가장 중요한 제약은 무엇이었나요?',
  verification: '말씀하신 변화는 어떤 기록이나 관찰로 확인했나요?',
  transfer: '이 경험에서 배운 방법을 지원 직무의 어떤 업무에 적용할 수 있나요?'
};

const core = new Set(['reasoning', 'action', 'outcome']);

export function selectCoachingQuestion(rubric, turns, prompts = questions) {
  const priority = Object.keys(rubric).filter(key => Object.hasOwn(prompts, key));
  const asked = new Set(turns.map(turn => turn.question.trim()));
  const candidates = priority.filter(key => rubric[key].status !== 'present' &&
    !asked.has(prompts[key]) &&
    (key !== 'verification' || !rubric.outcome || rubric.outcome.status === 'present'));
  const target = candidates.find(key => core.has(key) && rubric[key].status === 'missing') ??
    candidates.find(key => core.has(key)) ??
    candidates.find(key => rubric[key].status === 'missing') ??
    candidates[0];

  return target
    ? { target, text: prompts[target], readyToFinish: false }
    : {
        target: null,
        text: priority.every(key => rubric[key].status === 'present')
          ? '답변에서 모든 평가 기준의 근거를 찾았습니다. 면접을 종료하고 피드백을 확인하세요.'
          : '확인 질문을 마쳤습니다. 면접을 종료하면 아직 근거가 부족한 항목을 확인할 수 있습니다.',
        readyToFinish: true
      };
}
