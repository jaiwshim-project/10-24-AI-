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

const topics = { school: '진학상담교사(학교)', career: '취업상담코치(대학)', nutrition: '영양상담사(학교)' };
const criteria = { listening: '경청', context: '상황 파악', questions: '질문의 적절성',
  options: '대안 제시', agreement: '다음 행동 합의' };

function renderCounseling(counseling) {
  const panel = field('counseling-metrics');
  panel.replaceChildren();
  for (const [topic, label] of Object.entries(topics)) {
    const data = counseling[topic];
    const section = add(panel, 'section', '');
    section.className = 'counseling-metrics-card';
    section.dataset.topic = topic;
    add(section, 'h3', label);
    renderMetrics(add(section, 'dl', ''), [
      ['참여 기기', data.participants + '대'], ['시작', data.started + '회'], ['완료', data.completed + '회'],
      ['완료율', completionRate(data)], ['평균 총점', average(data.score, '점')]
    ]);
    const details = add(section, 'details', '');
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
    ['누적 앱 설치', usage.installs + '회'], ['오늘 접속', usage.today + '회'], ['누적 접속', usage.total + '회']
  ]);
  const usageDays = field('usage-days');
  usageDays.replaceChildren();
  for (const entry of data.daily) {
    const row = add(usageDays, 'tr', '');
    add(row, 'th', entry.date).scope = 'row';
    add(row, 'td', (usage.daily[entry.date] ?? 0) + '회');
  }
  renderCounseling(data.counseling);
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
async function refreshReport() {
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  report.hidden = true;
  status.textContent = '집계를 불러오는 중입니다.';
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
    report.hidden = false;
    status.textContent = data.started || Object.values(data.counseling).some(item => item.started) ? '' : '선택한 기간에 집계된 연습이 없습니다.';
  } catch (error) {
    status.textContent = error.message || '집계를 불러올 수 없습니다.';
  } finally {
    button.disabled = false;
  }
}
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
