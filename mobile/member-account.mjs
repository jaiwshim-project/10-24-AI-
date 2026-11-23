import { createClient } from '@supabase/supabase-js';
import { isInternalRoleplayEmail, normalizeEmail, roleplayLoginEmail } from '../lib/roleplay-account.mjs';

const client = createClient('https://xwpxulvywjthliphjuie.supabase.co', 'sb_publishable_Pr5BU31VxekvikkzMr2ctQ_K3-rXzdZ', {
  auth: { storageKey: 'roleplay-member-auth-v1', flowType: 'pkce' }
});
const table = 'roleplay_member_feedback';
const ui = id => document.getElementById(id);
let user = null;
let records = [];
let revision = 0;
let finishInitialization;
const ready = new Promise(resolve => { finishInitialization = resolve; });

function notify() {
  window.dispatchEvent(new Event('roleplay-member-change'));
}

async function refresh() {
  if (!user) return;
  const owner = user.id;
  const request = ++revision;
  const entries = [];
  ui('member-record-status').textContent = '실습 기록을 불러오는 중입니다.';
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await client.from(table).select('entry')
      .eq('owner_id', owner).order('completed_at', { ascending: false }).order('id')
      .range(offset, offset + 199);
    if (request !== revision || user?.id !== owner) return;
    if (error) {
      ui('member-record-status').textContent = '기록을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.';
      return;
    }
    entries.push(...data.map(row => row.entry));
    if (data.length < 200) break;
  }
  records = entries;
  ui('member-record-status').textContent = records.length ? records.length + '회 연습'
    : '로그인한 상태에서 면접을 마치면 평가 결과가 여기에 표시됩니다.';
  notify();
}

async function save(entry, owner) {
  if (!owner || user?.id !== owner) return false;
  const { error } = await client.from(table).insert({
    id: entry.id, owner_id: owner, completed_at: new Date(entry.completedAt).toISOString(), entry
  });
  if (error) return false;
  if (user?.id === owner) {
    records = [entry, ...records.filter(record => record.id !== entry.id)];
    ui('member-record-status').textContent = records.length + '회 연습';
    notify();
  }
  return true;
}

window.roleplayMember = {
  ready,
  userId: () => user?.id ?? null,
  records: () => records.slice(),
  refresh,
  save
};

client.auth.onAuthStateChange((event, session) => {
  const next = session?.user ?? null;
  const changed = user?.id !== next?.id;
  user = next;
  finishInitialization();
  ui('member-auth').hidden = Boolean(user);
  ui('member-private').hidden = !user;
  ui('member-email-display').textContent = isInternalRoleplayEmail(user?.email)
    ? '' : user?.email ?? '';
  if (changed) {
    revision++;
    records = [];
    notify();
    if (user) {
      const owner = user.id;
      setTimeout(() => { refreshProfile(owner); refresh(); }, 0);
    } else refreshProfile(null);
  }
  if (event === 'SIGNED_IN') {
    ui('member-auth-status').textContent = '';
    ui('member-form').reset();
    setSignup(false);
  }
});


const form = ui('member-form');
const status = ui('member-auth-status');
const goalForm = ui('member-goal-form');
const goalType = ui('member-goal-type');
const goalText = ui('member-goal');
const goalSave = ui('member-goal-save');
const goalStatus = ui('member-goal-status');
const goalsTable = 'roleplay_member_goals';
let signup = false;
let goals = new Map();

function setSignup(active) {
  signup = active;
  const fields = ui('member-signup-fields');
  fields.hidden = fields.disabled = !active;
  const password = ui('member-password');
  password.autocomplete = active ? 'new-password' : 'current-password';
  password.minLength = active ? 8 : 0;
  ui('member-mode-login').setAttribute('aria-pressed', String(!active));
  ui('member-mode-signup').setAttribute('aria-pressed', String(active));
  ui('member-submit').textContent = active ? '가입하기' : '로그인';
  status.textContent = '';
}

function displayGoal() {
  goalText.value = goals.get(goalType.value) ?? '';
}

function setGoalControls(loading) {
  goalType.disabled = goalText.disabled = goalSave.disabled = loading;
}

async function refreshProfile(owner) {
  goals = new Map();
  goalForm.reset();
  setGoalControls(true);
  goalStatus.textContent = '';
  const summary = ui('member-profile-summary');
  summary.textContent = '';
  summary.hidden = true;
  if (!owner) return;
  const [profile, saved] = await Promise.all([
    client.from('roleplay_member_profiles').select('nickname,user_type,practice_type,contact_email').eq('owner_id', owner).maybeSingle(),
    client.from(goalsTable).select('practice_type,goal').eq('owner_id', owner)
  ]);
  if (user?.id !== owner) return;
  if (profile.data) {
    const { nickname, user_type: type, practice_type: practice, contact_email: contactEmail } = profile.data;
    if (contactEmail) ui('member-email-display').textContent = contactEmail;
    const label = (id, value) => [...ui(id).options].find(option => option.value === value)?.textContent;
    summary.textContent = [nickname, label('member-user-type', type), label('member-practice-type', practice)].filter(Boolean).join(' · ');
    summary.hidden = false;
    goalType.value = practice;
  }
  if (saved.error) {
    goalStatus.textContent = '목표를 불러오지 못했습니다. 화면을 새로고침해 주세요.';
    return;
  }
  goals = new Map(saved.data.map(item => [item.practice_type, item.goal]));
  displayGoal();
  setGoalControls(false);
}

goalType.addEventListener('change', () => {
  displayGoal();
  goalStatus.textContent = '';
});
goalForm.addEventListener('submit', async event => {
  event.preventDefault();
  const owner = user?.id;
  if (!owner || goalSave.disabled) return;
  const practice = goalType.value;
  const goal = goalText.value.trim();
  setGoalControls(true);
  goalStatus.textContent = '저장하는 중입니다.';
  try {
    const result = goal
      ? await client.from(goalsTable).upsert({ owner_id: owner, practice_type: practice, goal })
      : await client.from(goalsTable).delete().eq('owner_id', owner).eq('practice_type', practice);
    if (user?.id !== owner) return;
    if (result.error) throw result.error;
    if (goal) goals.set(practice, goal);
    else goals.delete(practice);
    displayGoal();
    goalStatus.textContent = goal ? '목표를 저장했습니다.' : '이 유형의 목표를 비웠습니다.';
  } catch {
    if (user?.id === owner) goalStatus.textContent = '목표를 저장하지 못했습니다. 다시 시도해 주세요.';
  } finally {
    if (user?.id === owner) setGoalControls(false);
  }
});

ui('member-mode-login').addEventListener('click', () => setSignup(false));
ui('member-mode-signup').addEventListener('click', () => setSignup(true));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const registering = signup;
  const email = normalizeEmail(ui('member-email').value);
  const password = ui('member-password').value;
  let profile;
  if (registering) {
    const phone = ui('member-phone').value.trim().replace(/[\s().-]/g, '');
    const nickname = ui('member-nickname').value.trim();
    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      status.textContent = '휴대폰 번호를 숫자로 입력해 주세요. 국제번호에는 +를 사용할 수 있습니다.';
      ui('member-phone').focus();
      return;
    }
    if (nickname.length < 2) {
      status.textContent = '닉네임을 두 글자 이상 입력해 주세요.';
      ui('member-nickname').focus();
      return;
    }
    profile = { phone, nickname, user_type: ui('member-user-type').value, practice_type: ui('member-practice-type').value };
  }
  const buttons = ui('member-auth').querySelectorAll('button');
  buttons.forEach(button => { button.disabled = true; });
  status.textContent = registering ? '가입을 요청하고 있습니다.' : '로그인 중입니다.';
  try {
    if (registering) {
      const response = await fetch('/api/roleplay-signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, profile }),
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) {
        const body = await response.json();
        status.textContent = body.error ?? '가입을 완료하지 못했습니다.';
        return;
      }
    }
    let result = await client.auth.signInWithPassword({ email: await roleplayLoginEmail(email), password });
    if (!registering && result.error?.code === 'invalid_credentials' && !isInternalRoleplayEmail(email)) {
      result = await client.auth.signInWithPassword({ email, password });
    }
    if (result.error) {
      status.textContent = registering ? '가입은 완료되었습니다. 로그인 버튼으로 다시 시도해 주세요.'
        : '로그인할 수 없습니다. 이메일과 비밀번호를 확인해 주세요.';
    } else status.textContent = '';
  } catch {
    status.textContent = '서버에 연결하지 못했습니다. 다시 시도해 주세요.';
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
});
ui('member-signout').addEventListener('click', async () => {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) ui('member-record-status').textContent = '로그아웃을 완료하지 못했습니다. 다시 시도해 주세요.';
});
ui('member-refresh').addEventListener('click', refresh);
