(() => {
  const field = id => document.getElementById(id);
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speech = window.speechSynthesis;
  const options = {
    job: { title: 'A1. 취업면접 (취준생/대학생)', label: '지원할 직무를 아래에서 선택하세요.', values: {
      engineering: '개발·엔지니어링', operations: '운영·물류·관리', sales: '영업·고객 응대',
      product: '기획·제품', general: '기타 직무'
    } },
    college: { title: 'A2. 대학 입학 면접(고등생)', label: '질문 유형', values: {
      inquiry: '학생부·탐구 경험', motivation: '전공 지원동기', passage: '제시문 면접'
    } },
    counseling: { title: '상담 롤플레이', label: '상담 유형을 선택하세요', values: {
      school: '진학상담교사(학교)', career: '취업상담코치(대학)', nutrition: '영양상담사(학교)'
    } }
  };
  const rubricGroups = [
    ['P · Problem', ['problem']], ['R · Reasoning', ['reasoning']], ['O · Ownership', ['action']],
    ['V · Verification', ['outcome', 'verification']], ['E · Extension', ['transfer']]
  ];
  const labels = {
    job: { problem: '문제 정의', reasoning: '판단 근거', action: '본인 기여', outcome: '결과',
      verification: '확인 방법', transfer: '직무 적용' },
    college: { problem: '탐구 질문·쟁점', reasoning: '선택과 주장 근거', action: '본인 활동',
      outcome: '발견과 배움', verification: '관찰·자료 근거', transfer: '전공·후속 탐구 연결' },
    counseling: { listening: '경청', context: '상황 파악', questions: '질문의 적절성',
      options: '대안 제시', agreement: '다음 행동 합의' }
  };
  const statuses = { present: '근거 있음', partial: '부분 근거', missing: '근거 없음' };
  const sections = ['home', 'setup', 'session', 'result', 'coach', 'examples', 'account'];
  const navigation = field('bottom-nav');
  let currentView = 'home';
  let startingSession = false;
  let resumePracticeAfterLogin = false;
  const mic = field('mic');
  const micCheck = field('mic-check');
  const micHelp = field('mic-help');
  const android = /Android/i.test(navigator.userAgent || '');
  const replay = field('replay');
  const retry = field('retry');
  const finish = field('finish');
  const status = field('status');
  const conversation = field('conversation');
  const transcript = field('transcript');
  const caption = field('live-caption');
  const captionLabel = field('live-caption-label');
  const captionFinal = field('live-caption-final');
  const captionDraft = field('live-caption-draft');
  let type;
  let topic;
  let question;
  let turns = [];
  let finalStudentReply = null;
  let firstAttempt = null;
  const sessionFeedback = new Map();
  const dateLabel = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' });
  const timeLabel = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' });
  let selectedFeedbackId = null;
  let exampleReports;
  let counselingExamples;
  let examplePlayback = null;
  let exampleRequest = 0;
  let retakeQuestions = null;
  const isCounseling = () => type === 'counseling';
  let analyticsEnabled = false;
  let analyticsTicket = null;
  let practiceOwner = null;
  let analyticsParticipant = null;

  const analyticsAvailability = fetch('/api/interview-analytics?status=availability', { signal: AbortSignal.timeout(5000) })
    .then(response => response.ok ? response.json() : null)
    .then(data => { analyticsEnabled = data?.enabled === true; field('analytics-option').hidden = !analyticsEnabled; })
    .catch(() => {});

  function getAnalyticsParticipant() {
    if (!analyticsEnabled || new URLSearchParams(location.search).get('usage') === 'test') return null;
    try {
      const key = 'roleplay-analytics-device-v1';
      const id = localStorage.getItem(key) || crypto.randomUUID();
      localStorage.setItem(key, id);
      return id;
    } catch {
      return null;
    }
  }

  function openingRequest() {
    if (isCounseling()) return { action: 'start-counseling', counselingTopic: topic };
    return type === 'job' ? { action: 'start-practical', role: topic }
      : { action: 'start-admissions', admissionTopic: topic };
  }
  let state = 'idle';
  let requestToRetry;
  let utterance;
  let speechTimer;
  let installPrompt;

  function syncNavigation() {
    const busy = startingSession || (currentView === 'session' && ['starting', 'recording', 'ending', 'checking', 'waiting'].includes(state));
    for (const button of navigation.querySelectorAll('button')) {
      button.disabled = busy;
      const active = button.dataset.page ? button.dataset.page === currentView
        : ['setup', 'session', 'result'].includes(currentView) && button.dataset.type === type;
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  }

  function show(name) {
    if (currentView === 'examples' && name !== 'examples') stopExampleAudio();
    if (currentView === 'account' && name !== 'account') resumePracticeAfterLogin = false;
    if (name !== currentView) window.scrollTo(0, 0);
    currentView = name;
    for (const section of sections) field(section).hidden = section !== name;
    field('landing-nav').hidden = name !== 'home';
    syncNavigation();
  }

  function allowNavigation() {
    if (currentView !== 'session') return !startingSession;
    if (['starting', 'recording', 'ending', 'checking', 'waiting'].includes(state)) return false;
    if (turns.length && !window.confirm('실습을 나가면 이번 대화를 평가할 수 없습니다. 다른 메뉴로 이동할까요?')) return false;
    if (utterance) {
      utterance = null;
      clearTimeout(speechTimer);
      speech.cancel();
    }
    return true;
  }

  function setState(value, message) {
    state = value;
    status.textContent = message;
    mic.disabled = !['idle', 'speaking', 'starting', 'recording'].includes(value);
    mic.hidden = value === 'end' || value === 'error' || (isCounseling() && turns.length >= 8);
    mic.textContent = value === 'recording' ? '답변 끝내기' : value === 'starting' ? '마이크 연결 취소' : '마이크로 답하기';
    if (value !== 'idle') {
      micCheck.hidden = true;
      micHelp.hidden = true;
      micHelp.open = false;
    }
    replay.disabled = value !== 'idle' && value !== 'end' && value !== 'error';
    finish.disabled = !turns.length || !['idle', 'end', 'error'].includes(value) ||
      (retakeQuestions !== null && turns.length < retakeQuestions.length);
    retry.hidden = value !== 'error';
    syncNavigation();
  }

  function speakQuestion(returnState = 'idle') {
    const previousStatus = status.textContent;
    if (!speech || typeof SpeechSynthesisUtterance !== 'function') {
      setState(returnState, '이 브라우저에서 질문을 읽어줄 수 없습니다.');
      return;
    }
    const current = new SpeechSynthesisUtterance(question);
    current.lang = 'ko-KR';
    const koreanVoice = speech.getVoices().find(voice => voice.lang.toLowerCase().startsWith('ko'));
    if (koreanVoice) current.voice = koreanVoice;
    utterance = current;
    setState('speaking', isCounseling() ? 'AI 학생이 말하고 있습니다.' : 'AI 면접관이 질문하고 있습니다.');
    const done = interrupted => {
      if (utterance !== current) return;
      utterance = null;
      clearTimeout(speechTimer);
      if (interrupted) speech.cancel();
      setState(returnState, interrupted ? '질문을 읽지 못했습니다. 다시 듣기를 눌러 주세요.'
        : returnState === 'idle' ? '준비되면 마이크로 답하세요.' : previousStatus);
    };
    current.onend = () => done(false);
    current.onerror = () => done(true);
    speechTimer = setTimeout(() => done(true), Math.max(15000, question.length * 190));
    try { speech.speak(current); } catch { done(true); }
  }

  async function call(body, timeout = 45000) {
    const response = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, language: 'ko', ...body }),
      signal: AbortSignal.timeout(timeout)
    });
    const data = await response.json();
    if (!response.ok || typeof data.text !== 'string' || !data.text.trim()) {
      throw new Error(data.error || '면접 API 연결을 확인해 주세요.');
    }
    return data;
  }

  function showCaption(finalText, draftText, label) {
    captionLabel.textContent = label;
    captionFinal.textContent = finalText + (finalText && draftText ? ' ' : '');
    captionDraft.textContent = draftText;
    caption.hidden = !finalText && !draftText;
    if (!caption.hidden) scrollToLatest();
  }

  function scrollToLatest() {
    conversation.scrollTop = conversation.scrollHeight;
  }

  function addMessage(who, label, text) {
    const item = append(transcript, 'li', '');
    item.className = 'message message--' + who;
    append(item, 'strong', label);
    append(item, 'p', text);
    scrollToLatest();
  }

  function presentQuestion(text, returnState = 'idle') {
    showCaption('', '', '나 · 말하는 중');
    question = text;
    addMessage('coach', isCounseling() ? 'AI 학생' : 'AI 면접관 · 질문 ' + (turns.length + 1), text);
    speakQuestion(returnState);
  }

  document.querySelectorAll('[data-type]').forEach(button => {
    button.addEventListener('click', () => {
      if (!allowNavigation()) return;
      type = button.dataset.type;
      const config = options[type];
      field('setup-title').textContent = config.title;
      field('topic-label').textContent = config.label;
      field('topic').replaceChildren(...Object.entries(config.values).map(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
      }));
      if (button.dataset.topic) field('topic').value = button.dataset.topic;
      field('analytics-option').hidden = !analyticsEnabled;
      field('setup-intro').textContent = isCounseling()
        ? '당신은 상담자이고 AI는 가상의 학생입니다. 브라우저가 말을 전사해 Claude에 전달합니다. 실제 학생의 이름, 학교명, 연락처는 말하지 마세요.'
        : '한국어 음성 면접입니다. 브라우저가 음성을 텍스트로 변환하며, 제출된 전사문이 AI 면접관에 전달됩니다. 실명과 연락처는 말하지 마세요.';
      field('start').textContent = isCounseling() ? '음성 상담 시작' : '음성 면접 시작';
      field('setup-status').textContent = '';
      show('setup');
      field('setup-title').focus();
    });
  });

  function showLocalLink() {
    const setupStatus = field('setup-status');
    const link = document.createElement('a');
    link.href = 'http://127.0.0.1:3210/mobile/';
    link.textContent = '로컬 음성 면접 열기';
    setupStatus.replaceChildren('파일 주소에서는 면접 API를 호출할 수 없습니다. 로컬 서버를 실행한 뒤 ', link, '를 누르세요.');
  }

  field('setup-back').addEventListener('click', () => show('home'));
  field('setup-form').addEventListener('submit', async event => {
    event.preventDefault();
    const start = field('start');
    if (start.disabled) return;
    if (location.protocol === "file:") {
      showLocalLink();
      return;
    }
    topic = field('topic').value;
    startingSession = true;
    syncNavigation();
    start.disabled = field('setup-back').disabled = field('topic').disabled = true;
    field('setup-status').textContent = '계정을 확인하고 있습니다.';
    try {
      const member = window.roleplayMember;
      if (!member) {
        field('setup-status').textContent = '계정 화면을 열 수 없습니다. 앱을 새로고침해 주세요.';
        return;
      }
      await member.ready;
      if (!member.userId()) {
        resumePracticeAfterLogin = true;
        show('account');
        field('member-auth-status').textContent = '롤플레이를 시작하려면 로그인하거나 회원가입해 주세요.';
        field('account-title').focus();
        return;
      }
      if (!Recognition) {
        field('setup-status').textContent = '이 브라우저에서 음성 실습을 실행할 수 없습니다. Chrome에서 다시 시도해 주세요.';
        return;
      }
      if (!window.isSecureContext) {
        field('setup-status').textContent = '마이크를 이용하려면 HTTPS로 열린 앱이 필요합니다.';
        return;
      }
      field('setup-status').textContent = '첫 질문을 준비하고 있습니다.';
      await analyticsAvailability;
      analyticsParticipant = getAnalyticsParticipant();
      const opening = await call({ ...openingRequest(), analyticsParticipant });
      analyticsTicket = opening.analyticsTicket ?? null;
      firstAttempt = null;
      retakeQuestions = null;
      beginSession(opening.text);
    } catch {
      field('setup-status').textContent = '질문을 받지 못했습니다. API가 연결된 앱 주소에서 다시 시도해 주세요.';
    } finally {
      startingSession = false;
      syncNavigation();
      start.disabled = field('setup-back').disabled = field('topic').disabled = false;
    }
  });

  const recognitionErrors = {
    'not-allowed': android ? '마이크 권한이 차단됐습니다. 아래 Android 권한 안내를 확인해 주세요.'
      : '마이크 권한이 차단됐습니다. 브라우저에서 이 사이트의 마이크를 허용해 주세요.',
    'service-not-allowed': 'Chrome 음성 인식 서비스가 차단됐습니다. Chrome 일반 탭에서 열고 기기의 음성 인식 설정을 확인해 주세요.',
    'audio-capture': '마이크를 연결하지 못했습니다. 다른 앱의 통화나 녹음을 종료하고 다시 시도해 주세요.',
    'no-speech': '말소리가 감지되지 않았습니다. 듣고 있다는 안내가 뜨면 마이크 가까이에서 말씀해 주세요.',
    'network': 'Chrome 음성 인식 서비스에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
    'language-not-supported': '이 기기의 음성 인식에서 한국어를 사용할 수 없습니다.'
  };

  function beginSession(opening) {
    practiceOwner = window.roleplayMember?.userId() ?? null;
    turns = [];
    finalStudentReply = null;
    requestToRetry = null;
    transcript.replaceChildren();
    finish.textContent = isCounseling() ? '상담 종료' : '면접 종료';
    replay.textContent = isCounseling() ? '학생 말 다시 듣기' : '질문 다시 듣기';
    field('conversation').setAttribute('aria-label', isCounseling() ? '상담 대화' : '면접 대화');
    transcript.setAttribute('aria-label', isCounseling() ? '상담 대화 기록' : '면접 대화 기록');
    field('session-title').textContent = options[type].title + ' · ' + options[type].values[topic] +
      (retakeQuestions ? ' · 재답변' : '');
    show('session');
    presentQuestion(opening);
  }

  let recognition;
  let micTimer;
  function endCapture(capture, message) {
    if (recognition !== capture) return;
    recognition = null;
    clearTimeout(micTimer);
    if (message) {
      setState('idle', message);
      micCheck.hidden = !navigator.mediaDevices?.getUserMedia;
      micHelp.hidden = !android;
      micHelp.open = android && message === recognitionErrors['not-allowed'];
    }
  }

  function abortCapture(capture, message) {
    if (recognition !== capture) return;
    endCapture(capture, message);
    try { capture.abort(); } catch { /* The recognizer may have already stopped. */ }
  }

  function stopCapture(capture) {
    setState('ending', '음성 인식을 마무리하고 있습니다.');
    clearTimeout(micTimer);
    micTimer = setTimeout(() => {
      abortCapture(capture, '음성 인식이 완료되지 않았습니다. 마이크를 눌러 다시 답해 주세요.');
    }, 5000);
    try { capture.stop(); } catch {
      abortCapture(capture, '음성 인식을 종료하지 못했습니다. 마이크를 눌러 다시 답해 주세요.');
    }
  }

  mic.addEventListener('click', () => {
    if (state === 'recording') return stopCapture(recognition);
    if (state === 'starting') return abortCapture(recognition, '마이크 연결을 취소했습니다.');
    if (state !== 'idle' && state !== 'speaking') return;

    if (utterance) {
      utterance = null;
      clearTimeout(speechTimer);
      speech.cancel();
    }
    let capture;
    try { capture = new Recognition(); } catch {
      setState('idle', '마이크를 시작하지 못했습니다. Chrome에서 이 사이트의 마이크 권한을 확인해 주세요.');
      micCheck.hidden = !navigator.mediaDevices?.getUserMedia;
      return;
    }
    recognition = capture;
    showCaption('', '', '나 · 말하는 중');
    capture.lang = 'ko-KR';
    capture.continuous = true;
    capture.interimResults = true;
    let recognized = '';

    function listening() {
      if (recognition !== capture || state !== 'starting') return;
      clearTimeout(micTimer);
      setState('recording', '듣고 있습니다. 말씀을 마치면 답변 끝내기를 누르세요.');
      micTimer = setTimeout(() => {
        if (recognition === capture && state === 'recording') stopCapture(capture);
      }, 120000);
    }
    capture.onaudiostart = listening;
    capture.onresult = event => {
      if (recognition !== capture) return;
      listening();
      const results = Array.from(event.results);
      const finalized = results.filter(result => result.isFinal).map(result => result[0].transcript.trim()).filter(Boolean);
      const pending = results.filter(result => !result.isFinal).map(result => result[0].transcript.trim()).filter(Boolean);
      const finalText = finalized.join(' ').slice(0, 3000);
      const draftText = pending.join(' ').slice(0, Math.max(0, 3000 - finalText.length - Number(Boolean(finalText))));
      recognized = [finalText, draftText].filter(Boolean).join(' ');
      showCaption(finalText, draftText, '나 · 말하는 중');
    };
    capture.onerror = event => {
      const message = recognitionErrors[event.error] || '음성 인식을 시작하지 못했습니다. 마이크 권한을 확인해 주세요.';
      if (recognition === capture && recognized) {
        showCaption(recognized, '', '나 · 제출되지 않음');
      }
      abortCapture(capture, message);
    };
    capture.onend = () => {
      if (recognition !== capture) return;
      if (!recognized) {
        endCapture(capture, recognitionErrors['no-speech']);
        return;
      }
      endCapture(capture);
      const answer = recognized;
      showCaption('', '', '나 · 말하는 중');
      turns.push({ question, answer });
      if (turns.length === 1 && analyticsTicket) {
        fetch('/api/interview-analytics', { method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'first-answer', ticket: analyticsTicket })
        }).catch(() => {});
      }
      finalStudentReply = null;
      addMessage('candidate', '나', answer);
      if (retakeQuestions) {
        const next = retakeQuestions[turns.length];
        if (next) presentQuestion(next);
        else setState('end', '같은 질문에 모두 답했습니다. 면접을 종료하면 첫 답변과 비교할 수 있습니다.');
      } else if (!isCounseling() && turns.length >= 8) setState('end', '면접을 종료하면 PROVE 피드백을 볼 수 있습니다.');
      else request('followup');
    };
    try {
      setState('starting', '마이크를 연결하고 있습니다. Chrome이 권한을 물으면 허용해 주세요.');
      micTimer = setTimeout(() => {
        abortCapture(capture, '마이크를 연결하지 못했습니다. 아래에서 Chrome의 마이크 권한을 확인해 주세요.');
      }, 22000);
      capture.start();
    } catch {
      abortCapture(capture, '마이크를 시작하지 못했습니다. Chrome에서 이 사이트의 마이크 권한을 확인하고 다시 시도해 주세요.');
    }
  });

  micCheck.addEventListener('click', async () => {
    if (state !== 'idle' || !navigator.mediaDevices?.getUserMedia) return;
    setState('checking', 'Chrome의 마이크 권한을 확인하고 있습니다.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setState('idle', '마이크 연결이 확인됐습니다. 마이크로 답하기를 눌러 음성 인식을 다시 시작해 주세요.');
    } catch (error) {
      setState('idle', error.name === 'NotAllowedError' || error.name === 'SecurityError'
        ? recognitionErrors['not-allowed'] : recognitionErrors['audio-capture']);
      micCheck.hidden = false;
      micHelp.hidden = !android;
      micHelp.open = android && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
    }
  });


  function append(parent, tag, value) {
    const element = document.createElement(tag);
    element.textContent = value;
    parent.append(element);
    return element;
  }

  function showFeedback(data) {
    if (!firstAttempt && data.overall) {
      firstAttempt = { report: data, questions: turns.map(turn => turn.question), analyticsTicket };
    }
    renderRetakeComparison(field('retake-comparison'), retakeQuestions ? firstAttempt?.report : null, data, labels[type]);
    field('retake').hidden = isCounseling() || !firstAttempt?.questions.length;
    field('result-title').textContent = isCounseling() ? '상담 실습 피드백' : 'PROVE 면접 피드백';
    field('again').textContent = isCounseling() ? '다른 실습 시작' : '다른 면접 시작';
    if (data.overall) {
      const entry = {
        id: crypto.randomUUID(), completedAt: Date.now(), type,
        title: options[type].title + ' · ' + options[type].values[topic],
        report: data, baseline: retakeQuestions ? firstAttempt?.report : null
      };
      const note = field('feedback-save-note');
      if (practiceOwner) {
        note.hidden = false;
        note.textContent = '내 정보에 결과를 저장하고 있습니다.';
        window.roleplayMember.save(entry, practiceOwner).catch(() => false).then(saved => {
          note.hidden = saved;
          note.textContent = saved ? '' : '계정에 결과를 저장하지 못했습니다. 이 화면에서 평가를 확인할 수 있습니다.';
        });
      } else {
        const saved = storeInterviewFeedback(entry);
        if (!saved) sessionFeedback.set(entry.id, entry);
        note.hidden = saved;
        note.textContent = saved ? '' : '기기에 저장할 수 없습니다. 이번에 앱을 닫기 전까지는 기록을 볼 수 있습니다.';
      }
    }
    renderFeedback(data, type);
    show('result');
    field('result-title').focus();
  }

  function renderFeedback(data, interviewType, prefix = '') {
    const counseling = interviewType === 'counseling';
    renderInterviewOverview(field(prefix + 'overall'), data, labels[interviewType], counseling);
    const groups = counseling ? Object.entries(labels.counseling).map(([key, label]) => [label, [key]]) : rubricGroups;
    const panel = field(prefix + 'rubric');
    panel.replaceChildren();
    for (const [title, keys] of groups) {
      const assessed = keys.filter(key => data.rubric?.[key]);
      if (!assessed.length) continue;
      const article = append(panel, 'article', '');
      append(article, 'h2', title);
      for (const key of assessed) {
        const item = data.rubric[key];
        append(article, 'strong', labels[interviewType][key] + ' · ' + statuses[item.status]);
        if (item.studentQuote) {
          append(article, 'p', '학생의 선택');
          append(article, 'blockquote', item.studentQuote);
        }
        if (item.confirmationQuote) {
          append(article, 'p', '상담자의 최종 확인');
          append(article, 'blockquote', item.confirmationQuote);
        } else if (item.quote) append(article, 'blockquote', item.quote);
        append(article, 'p', item.advice);
      }
    }
    field(prefix + 'exercise').textContent = data.text;
  }

  const exampleButtons = document.querySelectorAll('[data-example]');
  function feedbackRecords() {
    return [...new Map([...readInterviewFeedback(), ...sessionFeedback.values()].map(entry => [entry.id, entry])).values()]
      .sort((a, b) => b.completedAt - a.completedAt);
  }

  function renderProgress(records) {
    const panel = field('feedback-progress');
    const list = field('feedback-progress-list');
    list.replaceChildren();
    panel.hidden = records.length === 0;
    field('feedback-progress-count').textContent = '전체 ' + records.length + '회 · 재답변 ' +
      records.filter(record => record.baseline).length + '회';
    const groups = groupInterviewFeedback(records);
    for (const [index, group] of groups.entries()) {
      const newest = group[0];
      const earliest = group[group.length - 1];
      const currentScore = newest.report.overall.score;
      const firstScore = earliest.report.overall.score;
      const difference = currentScore - firstScore;
      const signed = value => (value > 0 ? '+' : '') + value;
      const entry = append(list, 'details', '');
      entry.className = 'feedback-date progress-group';
      entry.open = index === 0;
      append(entry, 'summary', newest.title + ' · ' + group.length + '회');
      if (group.length >= 2) {
        append(entry, 'p', '첫 ' + firstScore + '점 → 최근 ' + currentScore + '점 (' + signed(difference) + '점)').className = 'progress-score';
        append(entry, 'p', dateLabel.format(earliest.completedAt) + ' ~ ' + dateLabel.format(newest.completedAt)).className = 'muted';
        append(entry, 'h3', newest.type === 'counseling' ? '상담 항목별 변화' : 'PROVE 항목별 변화');
        const items = append(entry, 'ul', '');
        for (const change of compareInterviewCriteria(earliest.report, newest.report)) {
          const caption = change.keys.map(key => labels[newest.type][key]).join(' · ');
          append(items, 'li', (change.letter ? change.letter + ' ' : '') + caption + ' · ' + change.first + '% → ' + change.latest + '% (' + signed(change.latest - change.first) + '%p)');
        }
      } else {
        append(entry, 'p', '첫 점수 ' + currentScore + ' / 100점').className = 'progress-score';
        append(entry, 'p', '이 유형을 한 번 더 연습하면 변화가 표시됩니다.').className = 'muted';
      }
      const key = newest.report.overall.priority;
      const priority = key ? newest.report.rubric[key]?.advice : null;
      if (priority || newest.report.text) {
        append(entry, 'h3', '다음 연습에서 보완할 점');
        append(entry, 'p', priority || newest.report.text);
      }
      const open = append(entry, 'button', '최근 피드백 자세히 보기');
      open.type = 'button';
      open.className = 'quiet';
      open.addEventListener('click', () => showExample('saved', newest));
    }
  }

  function renderHistory(records) {
    const list = field('feedback-history-list');
    const note = field('feedback-history-note');
    list.replaceChildren();
    note.textContent = records.length ? '저장한 피드백은 이 기기의 앱에서 볼 수 있습니다.'
      : '면접을 마치면 점수와 피드백이 이 기기에 저장됩니다.';
    const selected = records.find(entry => entry.id === selectedFeedbackId);
    const selectedDate = selected ? dateLabel.format(selected.completedAt) : null;
    let previousDate;
    let group;
    for (const entry of records) {
      const date = dateLabel.format(entry.completedAt);
      if (date !== previousDate) {
        group = append(list, 'details', '');
        group.className = 'feedback-date';
        group.open = !previousDate || date === selectedDate;
        append(group, 'summary', date);
        previousDate = date;
      }
      const button = append(group, 'button', '');
      button.type = 'button';
      button.className = 'feedback-record';
      button.setAttribute('aria-pressed', String(entry.id === selectedFeedbackId));
      const title = append(button, 'span', entry.title + (entry.baseline ? ' · 재답변' : ''));
      append(title, 'small', timeLabel.format(entry.completedAt) + (sessionFeedback.has(entry.id) ? ' · 이 세션만' : ''));
      append(button, 'strong', entry.report.overall.score + '점');
      button.addEventListener('click', () => showExample('saved', entry));
    }
  }

  function activateExampleTab(tab) {
    for (const name of ['interview', 'counseling']) {
      const selected = name === tab;
      const button = field(name + '-examples-tab');
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      field(name + '-examples-options').hidden = !selected;
    }
  }

  function renderExampleDialogue(item) {
    const panel = field('example-dialogue');
    const list = field('example-dialogue-messages');
    list.replaceChildren();
    panel.hidden = !item.messages?.length;
    const counseling = item.type === 'counseling';
    field('example-dialogue-title').textContent = counseling ? '상담 대화' : '면접 대화';
    item.messages?.forEach((message, index) => {
      const student = index % 2 === 0;
      const entry = append(list, 'li', '');
      entry.className = 'message message--' + (student ? 'coach' : 'candidate');
      const speaker = student ? (counseling ? 'AI 학생' : 'AI 면접관') : (counseling ? '상담자' : '지원자');
      append(entry, 'strong', speaker);
      append(entry, 'p', message);
    });
  }

  const exampleAudioLabels = {
    'example-dialogue': '롤플레이 대화 듣기',
    'example-coach': '사용자·AI코치 대화 듣기'
  };
  const exampleVoiceProfiles = {
    'AI 면접관': { voice: 0, pitch: 0.84, rate: 0.92 },
    '지원자': { voice: 1, pitch: 1.08, rate: 1 },
    'AI 학생': { voice: 1, pitch: 1.2, rate: 1.02 },
    '상담자': { voice: 0, pitch: 0.9, rate: 0.91 },
    '사용자': { voice: 2, pitch: 1.03, rate: 0.99 },
    'AI코치': { voice: 3, pitch: 0.88, rate: 0.89 }
  };

  function stopExampleAudio(message = '', cancel = true) {
    if (!examplePlayback) return;
    const { id } = examplePlayback;
    examplePlayback = null;
    if (cancel) speech.cancel();
    field(id + '-play').textContent = exampleAudioLabels[id];
    field(id + '-status').textContent = message;
  }

  function playExampleAudio(id) {
    if (examplePlayback?.id === id) {
      stopExampleAudio('재생을 중지했습니다.');
      return;
    }
    stopExampleAudio();
    if (!speech || typeof SpeechSynthesisUtterance !== 'function') {
      field(id + '-status').textContent = '이 브라우저에서는 대화를 읽을 수 없습니다.';
      return;
    }
    const messages = [...field(id + '-messages').children].map(row => ({
      speaker: row.querySelector('strong').textContent,
      text: row.querySelector('p').textContent
    }));
    if (!messages.length) return;
    const playback = { id, index: 0, utterance: null };
    examplePlayback = playback;
    field(id + '-play').textContent = '듣기 중지';
    const errorMessage = '음성을 재생하지 못했습니다. 기기의 한국어 음성 설정을 확인해 주세요.';

    function speakNext() {
      if (examplePlayback !== playback) return;
      if (playback.index >= messages.length) {
        stopExampleAudio('재생이 끝났습니다.', false);
        return;
      }
      const { speaker, text } = messages[playback.index];
      const profile = exampleVoiceProfiles[speaker];
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = speech.getVoices().filter(voice => /^ko(?:-|_|$)/i.test(voice.lang));
        if (voices.length) utterance.voice = voices[profile.voice % voices.length];
        utterance.lang = 'ko-KR';
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        playback.utterance = utterance;
        field(id + '-status').textContent = speaker + ' 재생 중 (' + (playback.index + 1) + '/' + messages.length + ')';
        utterance.onend = () => {
          if (examplePlayback !== playback || playback.utterance !== utterance) return;
          playback.index++;
          speakNext();
        };
        utterance.onerror = () => {
          if (examplePlayback === playback) stopExampleAudio(errorMessage, false);
        };
        speech.speak(utterance);
      } catch {
        stopExampleAudio(errorMessage);
      }
    }

    speakNext();
  }

  for (const id of Object.keys(exampleAudioLabels)) {
    field(id + '-play').addEventListener('click', () => playExampleAudio(id));
  }
  field('example-coach-dialogue').addEventListener('toggle', event => {
    if (!event.currentTarget.open && examplePlayback?.id === 'example-coach') stopExampleAudio();
  });
  window.addEventListener('pagehide', () => stopExampleAudio());

  async function showExample(selection, savedEntry) {
    stopExampleAudio();
    for (const id of Object.keys(exampleAudioLabels)) field(id + '-status').textContent = '';
    const records = feedbackRecords();
    const entry = savedEntry ?? (selection === 'latest' ? records[0] : null);
    selectedFeedbackId = entry?.id ?? null;
    renderHistory(records);
    renderProgress(records);
    const requestId = ++exampleRequest;
    const counselingSample = selection.startsWith('counseling-');
    activateExampleTab(counselingSample ? 'counseling' : 'interview');
    const content = field('example-content');
    const note = field('example-note');
    content.hidden = true;
    for (const button of exampleButtons) {
      if (button.dataset.example === 'latest') button.hidden = !records.length;
      button.setAttribute('aria-pressed', String(button.dataset.example === selection));
    }
    try {
      let item = entry;
      if (selection === 'job' || selection === 'college') {
        note.textContent = 'AI 피드백 사례를 불러오는 중입니다.';
        if (!exampleReports) {
          const response = await fetch('./feedback-example.json');
          if (!response.ok) throw new Error('Feedback examples unavailable');
          exampleReports = await response.json();
        }
        item = { ...exampleReports[selection], type: selection };
      }
      if (counselingSample) {
        note.textContent = '상담 피드백 사례를 불러오는 중입니다.';
        if (!counselingExamples) {
          const response = await fetch('./counseling-examples.json');
          if (!response.ok) throw new Error('Counseling examples unavailable');
          counselingExamples = await response.json();
          const list = field('counseling-examples-options');
          list.replaceChildren();
          for (const [index, sample] of counselingExamples.entries()) {
            const button = append(list, 'button', labelsForCounseling(sample) + ' · ' + sample.title);
            button.type = 'button';
            button.className = 'quiet';
            button.dataset.counselingExample = 'counseling-' + index;
            button.addEventListener('click', () => showExample(button.dataset.counselingExample));
          }
        }
        item = { ...counselingExamples[Number(selection.split('-')[1])], type: 'counseling' };
      }
      if (requestId !== exampleRequest || currentView !== 'examples') return;
      for (const button of field('counseling-examples-options').querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.dataset.counselingExample === selection));
      }
      if (!item?.report?.overall) throw new Error('Feedback unavailable');
      note.textContent = entry ? entry.title + (entry.baseline ? ' · 재답변' : '') + ' — ' +
        dateLabel.format(entry.completedAt) + ' ' + timeLabel.format(entry.completedAt)
        : counselingSample ? labelsForCounseling(item) + ' · ' + item.title + ' — 가상 대화의 Claude 평가'
          : '가상 면접 대화를 Claude에 제출해 받은 평가입니다.';
      renderExampleDialogue(item);
      const coachDialogue = field('example-coach-dialogue');
      coachDialogue.hidden = !item.coachDialogue?.length;
      coachDialogue.open = false;
      const coachMessages = field('example-coach-messages');
      coachMessages.replaceChildren();
      item.coachDialogue?.forEach((message, index) => {
        const coach = index % 2 === 1;
        const row = append(coachMessages, 'li', '');
        row.className = 'message message--' + (coach ? 'coach' : 'candidate');
        append(row, 'strong', coach ? 'AI코치' : '사용자');
        append(row, 'p', message);
      });
      field('example-rubric-title').textContent = item.type === 'counseling' ? '상담 항목별 피드백' : 'PROVE 항목별 피드백';
      renderRetakeComparison(field('example-comparison'), item.baseline, item.report, labels[item.type]);
      renderFeedback(item.report, item.type, 'example-');
      content.hidden = false;
      if (selection === 'saved') field('example-overall').focus();
    } catch {
      if (requestId === exampleRequest && currentView === 'examples') {
        note.textContent = '피드백 사례를 불러오지 못했습니다. 원하는 사례를 다시 눌러 주세요.';
      }
    }
  }

  function labelsForCounseling(example) {
    return options.counseling.values[example.topic];
  }

  const exampleTabs = ['interview', 'counseling'].map(name => field(name + '-examples-tab'));
  exampleTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showExample(index ? 'counseling-0' : 'job'));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? exampleTabs[0] : event.key === 'End' ? exampleTabs[1] : exampleTabs[1 - index];
      target.click();
      target.focus();
    });
  });

  for (const button of exampleButtons) {
    button.addEventListener('click', () => showExample(button.dataset.example));
  }

  async function request(action) {
    setState('waiting', action === 'followup'
      ? (isCounseling() ? 'AI 학생이 답변을 준비하고 있습니다.' : 'AI 면접관이 다음 질문을 준비하고 있습니다.')
      : '대화를 바탕으로 피드백을 작성하고 있습니다.');
    try {
      const context = type === 'job' ? { scenario: 'practical', role: topic }
        : isCounseling() ? { counselingTopic: topic } : { scenario: 'mobile-admissions', admissionTopic: topic };
      const data = await call({ ...context, action, turns, ...(action === 'feedback' && {
        analyticsTicket, ...(isCounseling() && finalStudentReply && { finalStudentReply })
      }) });
      requestToRetry = null;
      if (action === 'feedback') showFeedback(data);
      else if (data.readyToFinish) setState('end', '면접을 종료하면 PROVE 피드백을 볼 수 있습니다.');
      else if (isCounseling()) {
        finalStudentReply = data.text;
        if (turns.length >= 8) {
          setState('end', '상담을 종료하면 피드백을 볼 수 있습니다.');
          presentQuestion(data.text, 'end');
        } else presentQuestion(data.text);
      } else presentQuestion(data.text);
    } catch {
      requestToRetry = action;
      setState('error', 'AI 응답을 받지 못했습니다. 저장한 이번 답변으로 다시 요청할 수 있습니다.');
    }
  }

  replay.addEventListener('click', () => speakQuestion(state));
  retry.addEventListener('click', () => { if (requestToRetry && state === 'error') request(requestToRetry); });
  finish.addEventListener('click', () => { if (!finish.disabled) request('feedback'); });
  field('retake').addEventListener('click', async () => {
    if (!firstAttempt?.questions.length || field('result').hidden || startingSession) return;
    startingSession = true;
    syncNavigation();
    field('retake').disabled = field('again').disabled = true;
    analyticsTicket = null;
    try {
      if (firstAttempt.analyticsTicket) {
        const response = await call({ ...openingRequest(), analyticsParticipant,
          analyticsBaseline: firstAttempt.analyticsTicket }, 7500);
        analyticsTicket = response.analyticsTicket ?? null;
      }
    } catch {
      // Retaking remains available during an analytics outage.
    } finally {
      startingSession = false;
      field('retake').disabled = field('again').disabled = false;
      retakeQuestions = firstAttempt.questions;
      beginSession(retakeQuestions[0]);
    }
  });
  field('again').addEventListener('click', () => {
    firstAttempt = null;
    retakeQuestions = null;
    show('home');
  });

  function renderMemberHistory() {
    const list = field('member-records');
    list.replaceChildren();
    const detail = field('member-report');
    detail.hidden = true;
    for (const entry of window.roleplayMember?.records() ?? []) {
      if (!entry?.report?.overall || !entry.report.rubric || !labels[entry.type] ||
          !Number.isFinite(entry.completedAt) || !Number.isFinite(new Date(entry.completedAt).getTime())) continue;
      const button = append(list, 'button', '');
      button.type = 'button';
      button.className = 'feedback-record';
      const title = append(button, 'span', entry.title + (entry.baseline ? ' · 재답변' : ''));
      append(title, 'small', dateLabel.format(entry.completedAt) + ' ' + timeLabel.format(entry.completedAt));
      append(button, 'strong', entry.report.overall.score + '점');
      button.addEventListener('click', () => {
        renderFeedback(entry.report, entry.type, 'member-');
        renderRetakeComparison(field('member-comparison'), entry.baseline, entry.report, labels[entry.type]);
        detail.hidden = false;
        detail.scrollIntoView({ block: 'start' });
      });
    }
  }

  window.addEventListener('roleplay-member-change', () => {
    renderMemberHistory();
    if (resumePracticeAfterLogin && currentView === 'account' && window.roleplayMember?.userId()) {
      show('setup');
      field('setup-status').textContent = '로그인했습니다. 실습 시작을 누르면 대화를 시작합니다.';
      field('setup-title').focus();
    }
  });
  if (new URLSearchParams(location.search).get('view') === 'account') show('account');

  navigation.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      if (!allowNavigation()) return;
      show(button.dataset.page);
      field(button.dataset.page + '-title').focus();
      if (button.dataset.page === 'account') renderMemberHistory();
      if (button.dataset.page === 'examples') showExample(feedbackRecords().length ? 'latest' : 'job');
    });
  });

  const install = field('install');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    install.hidden = false;
  });
  install.addEventListener('click', async () => {
    if (installPrompt) await installPrompt.prompt();
    installPrompt = null;
    install.hidden = true;
  });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
