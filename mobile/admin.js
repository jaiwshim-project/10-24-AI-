const field = id => document.getElementById(id);
const form = field('metrics-form');
const status = field('metrics-status');
const report = field('report');

function add(parent, tag, value) {
  const child = document.createElement(tag);
  child.textContent = value;
  parent.append(child);
  return child;
}

function renderMetrics(list, entries) {
  list.replaceChildren();
  for (const [label, value] of entries) {
    const card = add(list, 'div', '');
    add(card, 'dt', label);
    add(card, 'dd', value);
  }
}

function average(metric, unit, delta = false) {
  if (!metric.count) return '데이터 없음';
  const sign = delta && metric.average > 0 ? '+' : '';
  return sign + metric.average + unit + ' (' + metric.count + (delta ? '쌍)' : '회)');
}

function completionRate(item) {
  return item.started ? (item.completed / item.started * 100).toFixed(1) + '%' : '데이터 없음';
}

const topics = { job: 'A1. 취업면접 (취준생/대학생)', college: 'A2. 대학입학 면접 (고등생)', school: 'B1. 진학상담교사(학교)', career: 'B2. 취업상담코치(대학)', nutrition: 'B3. 영양상담사(학교)' };
const criteria = { listening: '경청', context: '상황 파악', questions: '질문의 적절성',
  options: '대안 제시', agreement: '다음 행동 합의' };

function renderPracticeTypes(groups) {
  const panel = field('counseling-metrics');
  const expanded = new Set(Array.from(panel.querySelectorAll('details[open]'), el => el.parentElement.dataset.topic));
  panel.replaceChildren();
  for (const [topic, label] of Object.entries(topics)) {
    const data = groups[topic];
    if (!data) continue;
    const section = add(panel, 'section', '');
    section.className = 'counseling-metrics-card';
    section.dataset.topic = topic;
    add(section, 'h3', label);
    renderMetrics(add(section, 'dl', ''), [
      ['참여 기기', data.participants + '대'], ['시작', data.started + '회'], ['완료', data.completed + '회'],
      ['완료율', completionRate(data)], ['평균 총점', average(data.score, '점')]
    ]);
    const details = add(section, 'details', '');
    details.open = expanded.has(topic);
    if (data.components) {
      add(details, 'summary', 'PROVE 항목별 평균');
      const labels = ['문제 정의', '판단 근거', '본인 기여', '결과 확인', '다음 직무·전공에 적용'];
      renderMetrics(add(details, 'dl', ''), [...'PROVE'].map((letter, i) =>
        [letter + ' · ' + labels[i], average(data.components[letter], '%')]));
      continue;
    }
    add(details, 'summary', '상담 평가 5개 항목');
    const list = add(details, 'dl', '');
    renderMetrics(list, Object.entries(criteria).map(([key, title]) => [title, average(data.criteria[key], '%')]));
    Object.values(data.criteria).forEach((metric, index) => {
      if (metric.count) add(list.children[index], 'small',
        '충족 ' + metric.present + ' · 부분 ' + metric.partial + ' · 근거 없음 ' + metric.missing);
    });
  }
}

function render(data) {
  const usage = data.usage;
  renderMetrics(field('app-usage'), [
    ['설치 완료 감지', usage.installs + '회'], ['설치형 앱 실행 기기(누적)', usage.devices.installed + '대'],
    ['오늘 방문 기기', usage.devices.today + '대'], ['오늘 테스트 접속', usage.testToday + '회'], ['오늘 접속', usage.today + '회'], ['누적 접속', usage.total + '회']
  ]);
  const usageDays = field('usage-days');
  usageDays.replaceChildren();
  for (const entry of data.daily) {
    const row = add(usageDays, 'tr', '');
    add(row, 'th', entry.date).scope = 'row';
    add(row, 'td', (usage.daily[entry.date] ?? 0) + '회');
  }
  const comparison = field('comparison');
  comparison.replaceChildren();
  for (const [key, label] of Object.entries(topics)) {
    const item = data.comparison[key];
    const row = add(comparison, 'tr', '');
    add(row, 'th', label).scope = 'row';
    for (const value of [item.started, item.tracked ? item.answered + ' / ' + item.tracked : '—', item.completed, completionRate(item)]) add(row, 'td', value);
  }
  renderPracticeTypes({ ...data.interviews, ...data.counseling });
  renderMetrics(field('participation'), [
    ['참여 기기', data.participants + '대'],
    ['2회 이상 참여한 기기', data.returningParticipants + '대'],
    ['시작', data.started + '회'],
    ['완료', data.completed + '회'],
    ['완료율', completionRate(data)],
    ['미완료', data.incomplete + '회'],
    ['완료 대기', data.pending + '회'],
    ['평균 총점', average(data.score, '점')],
    ['재답변 완료', data.retakesCompleted + '회']
  ]);
  renderMetrics(field('effect'), [
    ['평균 총점 변화', average(data.retakeChange, '점', true)],
    ...Object.entries(data.prove).map(([letter, metric]) => [letter + ' 변화', average(metric, '%p', true)])
  ]);
  const daily = field('daily');
  daily.replaceChildren();
  for (const entry of data.daily) {
    const row = add(daily, 'tr', '');
    add(row, 'th', entry.date).scope = 'row';
    add(row, 'td', entry.started);
    add(row, 'td', entry.completed);
  }
}

const storageKey = 'roleplay-admin-view';
let session = '';
function setAuthenticated(active) {
  field('token').required = !active;
  field('token').parentElement.hidden = active;
  field('logout').hidden = !active;
}
function forget() {
  session = '';
  sessionStorage.removeItem(storageKey);
  setAuthenticated(false);
  report.hidden = true;
  field('token').value = '';
}
field('logout').addEventListener('click', () => {
  forget();
  location.reload();
});
async function refreshReport(automatic = false) {
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  if (!automatic) status.textContent = '집계를 불러오는 중입니다.';
  try {
    const query = new URLSearchParams({ days: field('days').value, type: field('type').value });
    const response = await fetch('/api/interview-analytics?' + query, {
      headers: session ? { 'X-Dashboard-Session': session } : { Authorization: 'Bearer ' + field('token').value.trim() },
      cache: 'no-store', signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) forget();
      throw new Error(data.error);
    }
    session = response.headers.get('X-Dashboard-Session') || session;
    if (session) {
      sessionStorage.setItem(storageKey, JSON.stringify({ session, days: query.get('days'), type: query.get('type') }));
      field('token').value = '';
      setAuthenticated(true);
    }
    render(data);
    field('updated').textContent = '마지막 갱신 ' + new Date().toLocaleTimeString('ko-KR', {timeZone: 'Asia/Seoul'}) + ' (한국 시간) · 60초마다 갱신';
    report.hidden = false;
    status.textContent = data.started || Object.values(data.counseling).some(item => item.started) ? '' : '선택한 기간에 집계된 연습이 없습니다.';
  } catch (error) {
    status.textContent = error.message || '집계를 불러올 수 없습니다.';
  } finally {
    button.disabled = false;
  }
}
setInterval(() => { if (session && !document.hidden) refreshReport(true); }, 60000);
form.addEventListener('submit', event => {
  event.preventDefault();
  refreshReport();
});
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey));
  if (saved?.session) {
    session = saved.session;
    field('days').value = saved.days;
    field('type').value = saved.type;
    setAuthenticated(true);
    refreshReport();
  }
} catch { forget(); }
