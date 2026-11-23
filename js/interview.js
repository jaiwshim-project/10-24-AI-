function createInterview(type) {
  const field = id => document.getElementById(id);
  const question = field('scenario-context');
  const questionCriterion = field('interview-question-criterion');
  const answer = field('interview-answer');
  const mic = field('interview-mic');
  const submit = field('interview-submit');
  const finish = field('interview-finish');
  const back = field('back-to-step1');
  const status = field('interview-status');
  const transcript = field('interview-transcript');
  const result = field('interview-result');
  const resultTitle = field('interview-result-title');
  const overallPanel = field('interview-overall');
  const feedback = field('interview-feedback');
  const retry = field('interview-retry');
  const practicalButton = field('interview-go-practical');
  const comparison = field('interview-comparison');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const maxTurns = 8;

  let language = 'ko';
  let scenario;
  let initialQuestion;
  let jobPosting;
  let selectedRole;
  let baseline = null;
  let turns = [];
  let recognition = null;
  let busy = false;
  let complete = false;
  let readyToFinish = false;
  let awaitingQuestion = false;

  function updateControls() {
    answer.disabled = busy || Boolean(recognition) || complete || readyToFinish || awaitingQuestion;
    mic.disabled = !Recognition || busy || complete || readyToFinish || awaitingQuestion;
    submit.disabled = busy || Boolean(recognition) || complete || readyToFinish ||
      turns.length >= maxTurns || (!awaitingQuestion && !answer.value.trim());
    submit.textContent = awaitingQuestion ? '꼬리질문 다시 받기' : '답변 제출';
    finish.disabled = busy || Boolean(recognition) || complete || (!turns.length && !answer.value.trim());
    back.disabled = busy || Boolean(recognition);
  }

  function start(prompt, locale, scenarioId, posting = '', role) {
    language = locale;
    scenario = scenarioId;
    initialQuestion = prompt;
    jobPosting = posting;
    selectedRole = role;
    baseline = null;
    resetRound();
  }

  function usesProve() {
    return type === 'job' && language === 'ko' &&
      ['problem-solving', 'case1', 'case2', 'case3', 'practical'].includes(scenario);
  }

  function showCriterion(target) {
    if (!questionCriterion) return;
    const criterion = scenario !== 'practical' && target && prove.find(({ keys }) => keys.includes(target));
    questionCriterion.hidden = !criterion;
    questionCriterion.textContent = criterion ? criterion.label +
      (criterion.keys.length > 1 ? ' · ' + labels[target] : '') : '';
  }

  function resetRound() {
    turns = [];
    complete = false;
    readyToFinish = false;
    awaitingQuestion = false;
    question.textContent = initialQuestion;
    showCriterion(null);
    if (resultTitle) resultTitle.textContent = usesProve() ? 'PROVE 맞춤 피드백' : '맞춤 면접 피드백';
    if (retry) retry.hidden = true;
    if (practicalButton) practicalButton.hidden = true;
    comparison?.replaceChildren();
    answer.value = '';
    transcript.replaceChildren();
    result.hidden = true;
    feedback.textContent = '';
    if (overallPanel) renderInterviewOverview(overallPanel, null, labels);
    status.textContent = baseline ? '같은 질문에 다시 답해 보세요.' : Recognition ? '' : '이 브라우저에서는 답변을 직접 입력해 주세요.';
    updateControls();
  }

  mic.addEventListener('click', () => {
    if (recognition) {
      recognition.stop();
      mic.disabled = true;
      return;
    }

    const capture = new Recognition();
    const previous = answer.value.trim();
    recognition = capture;
    capture.lang = language;
    capture.continuous = true;
    capture.interimResults = true;
    capture.onresult = event => {
      const speech = Array.from(event.results, item => item[0].transcript).join(' ');
      answer.value = [previous, speech].filter(Boolean).join(' ').slice(0, answer.maxLength);
    };
    capture.onerror = () => {
      status.textContent = '음성을 인식하지 못했습니다. 다시 시도하거나 답변을 직접 입력해 주세요.';
    };
    capture.onend = () => {
      recognition = null;
      mic.textContent = '음성 답변';
      if (status.textContent === '듣고 있습니다.') {
        status.textContent = '인식된 답변을 확인한 뒤 제출해 주세요.';
      }
      updateControls();
    };
    try {
      capture.start();
      mic.textContent = '음성 인식 끝내기';
      status.textContent = '듣고 있습니다.';
    } catch {
      recognition = null;
      status.textContent = '마이크를 시작하지 못했습니다. 답변을 직접 입력해 주세요.';
    }
    updateControls();
  });

  answer.addEventListener('input', updateControls);

  function saveAnswer() {
    turns.push({ question: question.textContent, answer: answer.value.trim() });
    const item = document.createElement('li');
    const prompt = document.createElement('strong');
    const response = document.createElement('p');
    prompt.textContent = questionCriterion?.textContent
      ? questionCriterion.textContent + ' — ' + question.textContent : question.textContent;
    response.textContent = answer.value.trim();
    item.append(prompt, response);
    transcript.append(item);
    answer.value = '';
  }

  async function request(action, pendingMessage) {
    busy = true;
    status.textContent = pendingMessage;
    updateControls();
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, language, scenario, turns, jobPosting, structured: Boolean(retry),
          evidenceCoaching: usesProve(), role: selectedRole }),
        signal: AbortSignal.timeout(45000)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.text) {
        throw new Error(payload.error || '면접 API를 연결할 수 없습니다.');
      }
      status.textContent = '';
      return payload;
    } catch (error) {
      status.textContent = error.name === 'TimeoutError'
        ? 'AI 응답 시간이 초과됐습니다. 다시 시도해 주세요.'
        : error.message + ' 답변은 이 화면에 남아 있습니다.';
      return null;
    } finally {
      busy = false;
      updateControls();
    }
  }

  submit.addEventListener('click', async () => {
    if (!awaitingQuestion) saveAnswer();
    if (turns.length === maxTurns) {
      status.textContent = '8개 답변을 완료했습니다. 면접을 마치고 피드백을 받아보세요.';
      answer.disabled = true;
      mic.disabled = true;
      submit.disabled = true;
      return;
    }
    awaitingQuestion = true;
    const next = await request('followup', 'AI 면접관이 꼬리질문을 준비하고 있습니다.');
    if (next) {
      readyToFinish = next.readyToFinish === true;
      if (readyToFinish) status.textContent = next.text;
      else question.textContent = next.text;
      showCriterion(readyToFinish ? null : next.target);
      awaitingQuestion = false;
      updateControls();
      if (readyToFinish) finish.focus();
      else question.focus();
    }
  });

  finish.addEventListener('click', async () => {
    if (answer.value.trim() && turns.length < maxTurns) {
      saveAnswer();
      awaitingQuestion = turns.length < maxTurns;
    }
    const report = await request('feedback', '답변을 바탕으로 맞춤 피드백을 작성하고 있습니다.');
    if (report) {
      complete = true;
      feedback.textContent = report.text;
      if (overallPanel) renderInterviewOverview(overallPanel, report, labels);
      if (retry && Object.keys(report.rubric ?? {}).length) {
        renderReport(report);
        baseline ??= report;
        retry.hidden = scenario === 'practical';
      }
      if (practicalButton) {
        practicalButton.hidden = false;
        practicalButton.textContent = scenario === 'practical' ? '다른 질문으로 실전 연습' : '처음 보는 질문으로 실전 연습';
      }
      result.hidden = false;
      updateControls();
      result.focus();
    }
  });

  const labels = {
    problem: '문제 정의', reasoning: '판단 근거', action: '본인 기여', outcome: '결과',
    verification: '결과를 확인한 방법', transfer: '직무 적용', jobFit: '채용공고 적합성'
  };
  const prove = [
    { label: 'P · Problem — 문제 정의', keys: ['problem'] },
    { label: 'R · Reasoning — 판단 근거', keys: ['reasoning'] },
    { label: 'O · Ownership — 본인 기여', keys: ['action'] },
    { label: 'V · Verification — 결과 확인', keys: ['outcome', 'verification'] },
    { label: 'E · Extension — 직무 적용', keys: ['transfer'] }
  ];
  const statuses = { present: '근거 있음', partial: '부분 근거', missing: '근거 없음' };

  function appendText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderReport(report) {
    comparison.replaceChildren();
    const groups = usesProve() ? [...prove, { label: labels.jobFit, keys: ['jobFit'] }]
      : Object.entries(labels).map(([key, label]) => ({ label, keys: [key] }));
    if (baseline) appendText(comparison, 'h4', usesProve() ? 'PROVE 재답변 비교' : '첫 면접과 재연습 비교');
    for (const { label, keys } of groups) {
      if (!keys.some(key => report.rubric?.[key])) continue;
      const section = appendText(comparison, 'section', '');
      appendText(section, baseline ? 'h5' : 'h4', label);
      for (const key of keys) {
        if (report.rubric?.[key]) renderCriterion(section, key, report.rubric[key], keys.length > 1);
      }
    }
  }

  function renderCriterion(section, key, current, showLabel) {
    if (showLabel) appendText(section, 'p', labels[key]);
    const columns = appendText(section, 'div', '');
    columns.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:1rem;margin-bottom:1rem';
    const assessments = baseline ? [['첫 면접', baseline.rubric?.[key]], ['재연습', current]] : [['', current]];
    for (const [round, item] of assessments) {
      if (!item) continue;
      const column = appendText(columns, 'div', '');
      appendText(column, 'strong', [round, statuses[item.status]].filter(Boolean).join(' · '));
      if (item.requirement) appendText(column, 'p', '공고 요건 “' + item.requirement + '”');
      if (item.quote) appendText(column, 'p', '답변 근거 “' + item.quote + '”');
      appendText(column, 'p', item.advice);
    }
  }

  retry?.addEventListener('click', () => {
    resetRound();
    question.focus();
  });

  return { start };
}
