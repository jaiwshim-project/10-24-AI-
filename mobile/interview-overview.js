function renderInterviewOverview(container, report, labels, counseling = false) {
  if (!container) return;
  container.replaceChildren();
  const overall = report?.overall;
  container.hidden = !overall;
  if (!overall) return;

  function add(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  }

  add(container, 'h2', counseling ? '상담 전체 평가' : '면접 전체 평가');
  add(container, 'p', overall.score + ' / 100점', 'overall-score');
  if (overall.feedback) add(container, 'p', overall.feedback);
  add(container, 'h3', '점수가 나온 이유');
  const list = add(container, 'ul', '', 'overall-breakdown');
  for (const component of overall.components) {
    const label = component.keys.map(key => labels[key]).join(' · ');
    add(list, 'li', (component.letter ? component.letter + ' ' : '') + label + ' ' + component.percent + '%');
  }
  const { strength, priority } = overall;
  if (strength && report.rubric[strength]?.quote) {
    add(container, 'h3', '잘한 답변 · ' + labels[strength]);
    add(container, 'blockquote', '“' + report.rubric[strength].quote + '”');
    add(container, 'p', overall.strengthReason || '이 평가 항목에 답변 원문의 구체적인 근거가 있습니다.');
  } else {
    add(container, 'h3', '잘한 답변');
    add(container, 'p', '현재 답변에서 강점으로 인용할 수 있는 근거가 충분하지 않습니다.');
  }
  const revision = overall.revision;
  if (revision) {
    add(container, 'h3', '개선할 답변 · ' + labels[revision.key]);
    add(container, 'p', '내 답변');
    add(container, 'blockquote', '“' + revision.source + '”');
    add(container, 'p', report.rubric[revision.key].advice);
    if (revision.example) {
      add(container, 'p', '다시 답한다면 · [괄호]는 내 경험으로 채우기');
      add(container, 'blockquote', revision.example);
    }
  }
  if (priority && priority !== revision?.key) {
    const item = report.rubric[priority];
    const state = item.status === 'missing' ? '근거 없음' : '부분 근거';
    add(container, 'p', '우선 보완 · ' + labels[priority] + ' (' + state + '). ' + item.advice);
  }
  add(container, 'p', counseling ? '상담 기준 다섯 항목의 충족률을 같은 비중으로 평균했습니다. 충족 100%, 부분 충족 50%, 근거 없음 0%입니다.' : '적용된 PROVE 항목의 충족률을 같은 비중으로 평균했습니다. 각 기준은 충족 100%, 부분 충족 50%, 근거 없음 0%이며, V는 적용된 세부 기준을 평균합니다.', 'overall-method');
}

function renderRetakeComparison(container, first, current, labels) {
  container.replaceChildren();
  container.hidden = !first?.overall || !current?.overall;
  if (container.hidden) return;

  function add(parent, tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    parent.append(node);
    return node;
  }

  const signed = value => (value > 0 ? '+' : '') + value;
  const name = { P: '문제 정의', R: '판단 근거', O: '본인 기여', V: '결과 확인', E: '직무·전공 적용' };
  const stateLabels = { missing: '근거 없음', partial: '부분 근거', present: '근거 있음' };
  const scoreChange = current.overall.score - first.overall.score;
  add(container, 'h2', '첫 답변과 재답변 비교');
  add(container, 'p', '같은 질문에 같은 순서로 답한 두 면접을 비교합니다.');
  const scores = add(container, 'div', '', 'retake-columns');
  for (const [title, report] of [['첫 답변', first], ['재답변', current]]) {
    const column = add(scores, 'div', '', 'retake-column');
    add(column, 'strong', title);
    add(column, 'p', report.overall.score + ' / 100점', 'retake-score');
  }
  add(container, 'p', '점수 변화 ' + signed(scoreChange) + '점', 'retake-delta');

  const improved = [];
  const details = add(container, 'div', '', 'retake-details');
  for (const after of current.overall.components) {
    const before = first.overall.components.find(item => item.letter === after.letter);
    if (!before || before.keys.join() !== after.keys.join()) continue;
    const delta = after.percent - before.percent;
    if (delta > 0) improved.push(after.letter + ' ' + name[after.letter]);
    const section = add(details, 'section', '', 'retake-group');
    add(section, 'h3', after.letter + ' · ' + name[after.letter]);
    add(section, 'p', before.percent + '% → ' + after.percent + '% (' + signed(delta) + '%p)');
    for (const key of after.keys) {
      const earlier = first.rubric[key];
      const later = current.rubric[key];
      if (!earlier || !later) continue;
      add(section, 'h4', labels[key] + ' · ' + stateLabels[earlier.status] + ' → ' + stateLabels[later.status]);
      const evidence = add(section, 'div', '', 'retake-columns');
      for (const [attempt, item] of [['첫 답변', earlier], ['재답변', later]]) {
        const column = add(evidence, 'div', '', 'retake-column');
        add(column, 'strong', attempt);
        if (item.quote) add(column, 'blockquote', '“' + item.quote + '”');
        else add(column, 'p', '인용할 근거 없음');
      }
      if (later.advice) add(section, 'p', '재답변 피드백 · ' + later.advice, 'overall-method');
    }
  }
  const summary = add(container, 'p', improved.length ? '충족률이 오른 항목 · ' + improved.join(', ')
    : '이번 재답변에서 충족률이 오른 항목은 없습니다.', 'retake-highlight');
  container.insertBefore(summary, details);
}
