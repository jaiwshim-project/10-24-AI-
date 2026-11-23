const proveGroups = {
  P: ['problem'],
  R: ['reasoning'],
  O: ['action'],
  V: ['outcome', 'verification'],
  E: ['transfer']
};
const values = { present: 1, partial: 0.5, missing: 0 };
const revisionPrompts = {
  problem: '당시 [구체적인 상황]에서 [해결할 문제 또는 궁금증]이 있었습니다.',
  reasoning: '저는 [실제로 확인한 단서]를 보고 [선택한 방법 또는 입장]을 정했습니다. 그 이유는 [선택의 근거]입니다.',
  action: '이 과정에서 제가 직접 맡은 일은 [직접 한 행동]이었습니다.',
  outcome: '그 뒤 [실제로 관찰한 결과 또는 새로 배운 점]이 있었습니다.',
  verification: '그 판단은 [확인한 자료 또는 관찰]에서 [구체적으로 확인한 내용]으로 뒷받침할 수 있습니다.',
  transfer: '이 경험에서 배운 [배운 점]을 바탕으로 앞으로 [구체적인 업무나 탐구 주제]에 [적용할 방법]을 시도하고 싶습니다.'
};

export function defaultRevision(key, source, language) {
  const example = language === 'ko' ? revisionPrompts[key] : undefined;
  return { key, source, example };
}

export function scoreInterview(rubric) {
  const components = Object.entries(proveGroups).flatMap(([letter, keys]) => {
    const applicable = keys.filter(key => Object.hasOwn(rubric, key));
    if (!applicable.length) return [];
    const fraction = applicable.reduce((sum, key) => sum + values[rubric[key].status], 0) / applicable.length;
    return [{ letter, keys: applicable, percent: fraction * 100 }];
  });
  if (!components.length) return null;

  const applicableKeys = components.flatMap(component => component.keys);
  const strength = applicableKeys.find(key => rubric[key].status === 'present') ??
    applicableKeys.find(key => rubric[key].status === 'partial');
  const priority = applicableKeys.find(key => rubric[key].status === 'missing') ??
    applicableKeys.find(key => rubric[key].status === 'partial');
  return {
    score: Math.round(components.reduce((sum, component) => sum + component.percent, 0) / components.length),
    components,
    strength,
    priority
  };
}
