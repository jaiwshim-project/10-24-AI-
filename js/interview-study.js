(() => {
  const field = id => document.getElementById('study-' + id);
  const questions = [
    '업무, 수업 또는 프로젝트에서 반복되는 실수를 줄인 경험을 말씀해 주세요. 어떤 상황에서 어떻게 대응했나요?',
    '업무, 수업 또는 프로젝트에서 반복되는 지연을 줄인 경험을 말씀해 주세요. 어떤 상황에서 어떻게 대응했나요?'
  ];
  const phases = { main: ['star', 'coaching'], factorial: ['star', 'followup', 'feedback', 'coaching'] };
  const phase = new URLSearchParams(location.search).get('phase') === 'factorial' ? 'factorial' : 'main';
  const storageKey = 'rolecoach-study-v2-' + phase;
  const delayMs = 72 * 60 * 60 * 1000;
  const delayedQuestion = '업무, 수업 또는 프로젝트에서 제한된 자원 때문에 품질이 낮아질 위험을 발견하고 대응한 경험을 말씀해 주세요.';
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const practice = '지원 직무와 관련해, 제약이 있는 상황에서 문제를 해결한 경험을 말씀해 주세요.';
  const guide = 'STAR 가이드\n상황: 어떤 일이 있었나요?\n과제: 무엇을 맡았나요?\n행동: 본인이 어떻게 대응했나요?\n결과: 무엇이 달라졌나요?';
  const labels = { reasoning: '판단 근거', action: '본인 행동', outcome: '결과' };
  const answerField = field('answer');
  const submit = field('submit');
  let group;
  let record;
  let capture;
  let spokenAnswer = '';
  let order;
  let stage;
  let pending = false;
  let followup;
  let coaching;
  const responses = {};

  function show(step, prompt, help = '') {
    stage = step;
    field('step').textContent = ({
      baseline: '1 / 5 · 사전 질문', practice: '2 / 5 · 연습 질문',
      supplement: '3 / 5 · 연습 답변 보완', retry: '4 / 5 · 같은 질문에 재답변',
      transfer: '5 / 5 · 새 질문', delayed: '72시간 후 · 새 음성 질문'
    })[step];
    field('question').textContent = prompt;
    field('help').textContent = help;
    field('status').textContent = '';
    answerField.value = '';
    field('voice').hidden = step !== 'delayed';
    answerField.readOnly = step === 'delayed';
    field('question').focus();
  }

  function randomBit() {
    return crypto.getRandomValues(new Uint8Array(1))[0] & 1;
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(record));
  }

  function progress() {
    const { participantId, phase, group, status, stage, startedAt, completedAt, stoppedAt, reason, requests } = record;
    download('면접-진행-' + participantId + '.json', { participantId, phase, group, status, stage, startedAt, completedAt, stoppedAt, reason, requests });
  }

  field('consent').addEventListener('change', event => {
    field('start').disabled = !event.target.checked;
  });
  field('start').addEventListener('click', () => {
    if (record || !field('consent').checked) return;
    const arms = phases[phase];
    group = arms[crypto.getRandomValues(new Uint8Array(1))[0] % arms.length];
    order = randomBit();
    record = { participantId: crypto.randomUUID(), phase, group, order, startedAt: Date.now(), status: 'started', stage: 'baseline', requests: [] };
    try { save(); } catch {
      record = null;
      field('storage-error').textContent = '이 브라우저에 진행 기록을 저장할 수 없습니다. 사이트 저장을 허용한 뒤 시작해 주세요.';
      return;
    }
    field('stop').hidden = false;
    field('intro').hidden = true;
    field('round').hidden = false;
    show('baseline', questions[order], '지금 답할 수 있는 범위에서 작성하세요.');
  });

  async function ask(action, turns) {
    const started = performance.now();
    let ok = false;
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({ type: 'job', scenario: 'problem-solving', language: 'ko', action, turns, structured: true })
      });
      const result = await response.json();
      if (!response.ok || typeof result.text !== 'string' || !result.text.trim()) {
        throw new Error('Invalid interview response');
      }
      ok = true;
      return result;
    } finally {
      record.requests.push({ action, waitMs: Math.round(performance.now() - started), ok });
      save();
    }
  }

  function formatFeedback(report, turns) {
    const lines = Object.entries(labels).map(([key, label]) => {
      const item = report.rubric?.[key];
      if (!item || typeof item.advice !== 'string' ||
          !['present', 'partial', 'missing'].includes(item.status) ||
          (item.status !== 'missing' && !item.quote) ||
          (item.quote && !turns.some(turn => turn.answer.includes(item.quote)))) {
        throw new Error('Invalid feedback evidence');
      }
      return label + '\n' + (item.quote ? '내 답변 “' + item.quote + '”\n' : '이 항목의 근거가 없습니다.\n') + item.advice;
    });
    return [...lines, report.text].join('\n\n');
  }

  function download(file, data) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function complete(transfer) {
    record.rows = [
      { answerId: crypto.randomUUID(), question: questions[order], answer: responses.baseline },
      { answerId: crypto.randomUUID(), question: questions[1 - order], answer: transfer }
    ];
    record.completedAt = Date.now();
    record.status = 'completed';
    save();
    showDone();
  }

  function showDone() {
    field('intro').hidden = true;
    field('round').hidden = true;
    field('done').hidden = false;
    const completed = record.status === 'completed';
    field('blind').hidden = !completed;
    field('key').hidden = !completed;
    field('done').querySelector('h2').textContent = completed ? '응답을 모두 제출했습니다' : '참여가 중단됐습니다';
    field('delayed').hidden = !completed || Boolean(record.delayed);
    field('delayed-info').textContent = completed
      ? record.delayed ? '지연 평가가 완료됐습니다. 답변과 배정표를 다시 내려받으세요.'
        : '지연 평가 시작 시각: ' + new Date(record.completedAt + delayMs).toLocaleString('ko-KR')
      : '운영자에게 진행 기록 파일을 전달해 주세요.';
    field('done').focus();
  }

  field('blind').addEventListener('click', () => {
    const rows = record.delayed ? [...record.rows, record.delayed] : record.rows;
    download('면접-블라인드-' + record.participantId + '.json', randomBit() ? rows : [...rows].reverse());
  });
  field('key').addEventListener('click', () => download('면접-배정표-' + record.participantId + '.json', {
    protocol: 'rolecoach-star-transfer-v2', participantId: record.participantId, phase: record.phase, group: record.group,
    baselineQuestion: record.order ? 'B' : 'A', transferQuestion: record.order ? 'A' : 'B',
    baselineAnswerId: record.rows[0].answerId, transferAnswerId: record.rows[1].answerId,
    delayedAnswerId: record.delayed?.answerId
  }));
  field('progress').addEventListener('click', progress);
  field('progress-active').addEventListener('click', progress);
  field('stop').addEventListener('click', () => {
    if (pending || !window.confirm('이번 참여를 중단할까요? 답변은 평가에 포함되지 않습니다.')) return;
    record.status = 'stopped';
    record.stoppedAt = Date.now();
    record.reason = field('status').textContent.includes('다시 제출') ? 'api-error' : 'participant-stop';
    save();
    progress();
    showDone();
  });

  field('delayed').addEventListener('click', () => {
    if (Date.now() < record.completedAt + delayMs) {
      field('delayed-info').textContent = '아직 평가 시간이 되지 않았습니다. ' + new Date(record.completedAt + delayMs).toLocaleString('ko-KR') + ' 이후 이 브라우저에서 다시 열어 주세요.';
      return;
    }
    if (!Recognition) {
      field('delayed-info').textContent = '이 브라우저의 음성 인식을 사용할 수 없습니다. 이 기기의 같은 브라우저에서 음성 인식 지원 여부를 확인해 주세요.';
      return;
    }
    spokenAnswer = '';
    submit.disabled = true;
    field('stop').hidden = true;
    field('done').hidden = true;
    field('round').hidden = false;
    show('delayed', delayedQuestion, '연습에서 사용하지 않은 경험으로 말해 주세요. 인식된 텍스트를 확인한 뒤 제출합니다.');
  });

  field('voice').addEventListener('click', () => {
    if (capture) { capture.stop(); field('voice').disabled = true; return; }
    const recognition = new Recognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    const previous = answerField.value.trim();
    let transcript = '';
    capture = recognition;
    recognition.onresult = event => {
      transcript = Array.from(event.results, result => result[0].transcript).join(' ');
      spokenAnswer = [previous, transcript].filter(Boolean).join(' ').slice(0, 3000);
      answerField.value = spokenAnswer;
    };
    recognition.onerror = () => { field('status').textContent = '음성을 인식하지 못했습니다. 다시 시도해 주세요.'; };
    recognition.onend = () => {
      capture = null;
      field('voice').disabled = false;
      field('voice').textContent = '음성 입력 시작';
      answerField.readOnly = !spokenAnswer.trim();
      submit.disabled = !spokenAnswer.trim();
    };
    try {
      recognition.start();
      answerField.readOnly = true;
      submit.disabled = true;
      field('status').textContent = '듣고 있습니다.';
      field('voice').textContent = '음성 입력 끝내기';
    } catch {
      capture = null;
      field('status').textContent = '마이크를 시작하지 못했습니다.';
    }
  });

  try {
    record = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (record?.status === 'started') {
      record.status = 'interrupted';
      record.stoppedAt = Date.now();
      record.reason = 'page-closed-or-reloaded';
      save();
    }
    if (record) showDone();
  } catch {
    field('storage-error').textContent = '이 브라우저에 저장한 참여 정보를 읽을 수 없습니다.';
  }
  field('form').addEventListener('submit', async event => {
    event.preventDefault();
    const answer = answerField.value.trim();
    if (pending || capture || !answer || (stage === 'delayed' && !spokenAnswer.trim())) return;
    pending = true;
    answerField.readOnly = true;
    submit.disabled = true;
    try {
      switch (stage) {
        case 'baseline':
          responses.baseline = answer;
          show('practice', practice, guide + '\n\n사전 질문과 다른 경험을 사용해 주세요.');
          break;
        case 'practice':
          field('status').textContent = '다음 연습 질문을 준비하는 중입니다.';
          followup = ['followup', 'coaching'].includes(group)
            ? (await ask('followup', [{ question: practice, answer }])).text
            : 'STAR 가이드를 보고 방금 답변에 덧붙일 내용을 작성해 주세요.';
          responses.practice = answer;
          show('supplement', followup, guide + '\n\n추가할 내용이 없다면 “추가 없음”이라고 입력해 주세요.');
          break;
        case 'supplement': {
          field('status').textContent = '재답변 안내를 준비하는 중입니다.';
          const turns = [{ question: practice, answer: responses.practice }, { question: followup, answer }];
          coaching = ['feedback', 'coaching'].includes(group) ? formatFeedback(await ask('feedback', turns), turns) : '';
          show('retry', practice, [guide, coaching, '지금까지 정리한 내용을 한 답변으로 다시 작성하세요.'].filter(Boolean).join('\n\n'));
          break;
        }
        case 'retry':
          show('transfer', questions[1 - order], '앞서 연습한 사례와 다른 경험을 바탕으로 답해 주세요.');
          break;
        case 'transfer':
          complete(answer);
          break;
        case 'delayed':
          record.delayed = { answerId: crypto.randomUUID(), question: delayedQuestion, answer };
          save();
          showDone();
          break;
      }
      record.stage = stage;
      save();
    } catch {
      field('status').textContent = 'AI 응답을 받지 못했습니다. 입력한 답변은 유지됩니다. 다시 제출해 주세요.';
    } finally {
      pending = false;
      answerField.readOnly = false;
      submit.disabled = false;
    }
  });
})();
