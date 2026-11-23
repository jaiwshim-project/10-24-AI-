import { createClient } from '@supabase/supabase-js';

const client = createClient('https://xwpxulvywjthliphjuie.supabase.co', 'sb_publishable_Pr5BU31VxekvikkzMr2ctQ_K3-rXzdZ', {
  auth: { storageKey: 'roleplay-member-auth-v1', flowType: 'pkce' }
});
const table = 'roleplay_member_feedback';
const ui = id => document.getElementById(id);
let user = null;
let records = [];
let revision = 0;

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
  userId: () => user?.id ?? null,
  records: () => records.slice(),
  refresh,
  save
};

client.auth.onAuthStateChange((event, session) => {
  const next = session?.user ?? null;
  const changed = user?.id !== next?.id;
  user = next;
  ui('member-auth').hidden = Boolean(user);
  ui('member-private').hidden = !user;
  ui('member-email-display').textContent = user?.email ?? '';
  if (changed) {
    revision++;
    records = [];
    notify();
    if (user) setTimeout(refresh, 0);
  }
  if (event === 'SIGNED_IN') {
    ui('member-auth-status').textContent = '';
    ui('member-form').reset();
  }
});

const form = ui('member-form');
const status = ui('member-auth-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const signup = event.submitter?.value === 'signup';
  const email = ui('member-email').value.trim();
  const password = ui('member-password').value;
  if (signup && password.length < 8) {
    status.textContent = '회원가입 비밀번호는 8자 이상 입력해 주세요.';
    return;
  }
  const buttons = form.querySelectorAll('button');
  buttons.forEach(button => { button.disabled = true; });
  status.textContent = signup ? '가입을 요청하고 있습니다.' : '로그인 중입니다.';
  try {
    const result = signup
      ? await client.auth.signUp({ email, password, options: {
        emailRedirectTo: new URL('./?view=account', location.href).href
      } })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) {
      status.textContent = result.error.code === 'email_not_confirmed' ? '가입 확인 이메일의 링크를 먼저 눌러 주세요.'
        : signup ? '가입 요청을 처리하지 못했습니다. 이메일과 비밀번호를 확인하거나 잠시 뒤 다시 시도해 주세요.'
          : '로그인할 수 없습니다. 이메일과 비밀번호를 확인해 주세요.';
    } else if (signup && !result.data.session) {
      status.textContent = '확인 이메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.';
    } else {
      status.textContent = '';
    }
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
