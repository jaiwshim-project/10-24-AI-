import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import pg from 'pg';
import supabaseCa from './supabase-root-ca.mjs';

let pool;
const dayMs = 86400000;
const counselingTopics = ['school', 'career', 'nutrition'];
const counselingCriteria = ['listening', 'context', 'questions', 'options', 'agreement'];
const offset = 9 * 3600000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const day = time => new Date(time + offset).toISOString().slice(0, 10);
const digest = value => createHash('sha256').update(value).digest();

export function analyticsConfigured() {
  return Boolean(process.env.INTERVIEW_ANALYTICS_DATABASE_URL &&
    process.env.INTERVIEW_ADMIN_TOKEN?.length >= 32);
}

export function isAnalyticsAdmin(header) {
  const secret = process.env.INTERVIEW_ADMIN_TOKEN;
  return typeof header === 'string' && secret?.length >= 32 &&
    timingSafeEqual(digest(header), digest('Bearer ' + secret));
}

export async function verifyAnalyticsPin(header, clientAddress) {
  const pin = process.env.INTERVIEW_ADMIN_PIN;
  if (!analyticsConfigured() || !/^\d{6}$/.test(pin ?? '') ||
      typeof header !== 'string' || !/^Bearer \d{6}$/.test(header)) return 'invalid';
  if (!await allowAttempt('admin-attempt', 'global', clientAddress, 10, 120)) return 'limited';
  return timingSafeEqual(digest(header), digest('Bearer ' + pin)) ? 'ok' : 'invalid';
}

export async function allowRoleplaySignup(clientAddress) {
  if (!analyticsConfigured()) throw new Error('Missing rate limit configuration');
  return allowAttempt('roleplay-signup', 'roleplay-signup-global', clientAddress, 12, 160);
}

async function allowAttempt(namespace, globalScope, clientAddress, perAddress, total) {
  const address = typeof clientAddress === 'string' ? clientAddress.split(',')[0].trim() : 'unknown';
  const scope = createHmac('sha256', process.env.INTERVIEW_ADMIN_TOKEN).update(namespace + ':' + address).digest('hex');
  const { rows } = await query(
    `insert into roleplay_metrics.admin_pin_attempts (scope, window_start, attempts)
      values ($1, date_trunc('hour', now()), 1), ($2, date_trunc('hour', now()), 1)
      on conflict (scope, window_start) do update
      set attempts = admin_pin_attempts.attempts + 1
      where admin_pin_attempts.attempts < case when excluded.scope = $1 then $3::integer else $4::integer end
      returning scope`,
    [globalScope, scope, total, perAddress]
  );
  return rows.length === 2;
}

function query(sql, parameters) {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.INTERVIEW_ANALYTICS_DATABASE_URL,
      ssl: { ca: supabaseCa, rejectUnauthorized: true },
      max: 2,
      connectionTimeoutMillis: 4500,
      query_timeout: 2500,
      idleTimeoutMillis: 5000,
      allowExitOnIdle: true
    });
    pool.on('error', handleIdleError);
  }
  return pool.query(sql, parameters);
}

export async function recordUsage(event) {
  await query(`insert into roleplay_metrics.app_usage_daily(day, visits, installs)
    values ((now() at time zone 'Asia/Seoul')::date, $1, $2)
    on conflict (day) do update set visits = app_usage_daily.visits + excluded.visits,
    installs = app_usage_daily.installs + excluded.installs`, [Number(event === 'visit'), Number(event === 'install')]);
}

export async function readUsage() {
  const { rows } = await query('select day::text, visits, installs from roleplay_metrics.app_usage_daily', []);
  const daily = Object.fromEntries(rows.map(row => [row.day, Number(row.visits)]));
  return { daily, today: daily[day(Date.now())] ?? 0,
    total: rows.reduce((n, row) => n + Number(row.visits), 0),
    installs: rows.reduce((n, row) => n + Number(row.installs), 0) };
}

function handleIdleError() {
  console.warn('[interview] Idle analytics database connection lost');
}

function sign(payload) {
  return createHmac('sha256', process.env.INTERVIEW_ADMIN_TOKEN).update('interview-analytics:' + payload).digest('base64url');
}

function parseTicket(ticket) {
  if (typeof ticket !== 'string' || ticket.length > 2048) return null;
  const [payload, signature, extra] = ticket.split('.');
  if (!payload || !signature || extra !== undefined ||
      !timingSafeEqual(digest(signature), digest(sign(payload)))) return null;
  const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return Date.now() - session.startedAt <= dayMs ? session : null;
}

export async function beginAnalytics(participant, type, topic, baselineTicket, opening) {
  if (!analyticsConfigured() || typeof participant !== 'string' || !uuid.test(participant)) return null;
  try {
    const baseline = parseTicket(baselineTicket);
    if (baselineTicket && (!baseline || baseline.type !== type || baseline.topic !== topic ||
        baseline.participant !== participant || baseline.baseline)) return null;
    const session = { id: randomUUID(), participant, type, topic, startedAt: Date.now(),
      ...(baseline && { baseline: { id: baseline.id, startedAt: baseline.startedAt } }) };
    await query(
      'insert into roleplay_metrics.interview_sessions (id, participant, interview_type, topic, started_at, baseline_id) ' +
      'values ($1, $2, $3, $4, $5, $6)',
      [session.id, participant, type, topic, new Date(session.startedAt), baseline?.id ?? null]
    );
    const ticket = Buffer.from(JSON.stringify({ ...session, openingHash: baseline?.openingHash ?? digest(opening).toString('hex') })).toString('base64url');
    return ticket + '.' + sign(ticket);
  } catch {
    console.warn('[interview] Analytics start unavailable');
    return null;
  }
}

export async function completeAnalytics(ticket, type, topic, turns, overall) {
  if (!analyticsConfigured() || !ticket) return;
  try {
    const session = parseTicket(ticket);
    if (!session || session.type !== type || session.topic !== topic ||
        session.openingHash !== digest(turns[0].question).toString('hex')) return;
    const summary = type === 'counseling' ? {
      score: overall.score,
      criteria: Object.fromEntries(overall.components.map(component => [component.keys[0], component.percent]))
    } : {
      score: overall.score,
      prove: Object.fromEntries(overall.components.map(component => [
        component.letter, { percent: component.percent, keys: component.keys.join(',') }
      ])),
      questionsHash: digest(JSON.stringify(turns.map(turn => turn.question))).toString('hex')
    };
    await query(
      'update roleplay_metrics.interview_sessions set summary = $2 where id = $1 and summary is null',
      [session.id, summary]
    );
  } catch {
    console.warn('[interview] Analytics completion unavailable');
  }
}

function measure(numbers) {
  return { count: numbers.length, average: numbers.length
    ? Math.round(numbers.reduce((sum, number) => sum + number, 0) * 10 / numbers.length) / 10 : null };
}

function summarize(entries, completed, now) {
  const finished = entries.filter(session => completed.has(session.id));
  const startsByParticipant = new Map();
  for (const { participant } of entries) startsByParticipant.set(participant, (startsByParticipant.get(participant) ?? 0) + 1);
  const pairs = new Map();
  for (const session of finished) {
    const baseline = session.baseline;
    const result = completed.get(session.id);
    const before = baseline && completed.get(baseline.id);
    if (!before || before.questionsHash !== result.questionsHash) continue;
    if (!pairs.has(baseline.id) || session.startedAt < pairs.get(baseline.id).startedAt) pairs.set(baseline.id, session);
  }
  const deltas = [...pairs].map(([id, session]) => [completed.get(id), completed.get(session.id)]);
  const prove = Object.fromEntries([...'PROVE'].map(letter => [letter, measure(deltas.flatMap(([before, after]) => {
    const first = before.prove[letter];
    const next = after.prove[letter];
    return first && next && first.keys === next.keys ? [next.percent - first.percent] : [];
  }))]));
  return {
    participants: startsByParticipant.size,
    returningParticipants: [...startsByParticipant.values()].filter(count => count > 1).length,
    started: entries.length,
    completed: finished.length,
    retakesCompleted: finished.filter(session => session.baseline).length,
    incomplete: entries.filter(session => !completed.has(session.id) && now - session.startedAt > dayMs).length,
    pending: entries.filter(session => !completed.has(session.id) && now - session.startedAt <= dayMs).length,
    score: measure(finished.map(session => completed.get(session.id).score)),
    retakeChange: measure(deltas.map(([before, after]) => after.score - before.score)),
    prove
  };
}

function summarizeCounseling(entries, completed) {
  const finished = entries.flatMap(session => completed.has(session.id) ? [completed.get(session.id)] : []);
  const criteria = Object.fromEntries(counselingCriteria.map(key => {
    const values = finished.map(result => result.criteria?.[key]).filter(value => [0, 50, 100].includes(value));
    return [key, { ...measure(values),
      present: values.filter(value => value === 100).length,
      partial: values.filter(value => value === 50).length,
      missing: values.filter(value => value === 0).length }];
  }));
  return {
    participants: new Set(entries.map(session => session.participant)).size,
    started: entries.length,
    completed: finished.length,
    score: measure(finished.map(result => result.score)),
    criteria
  };
}

export async function readAnalytics(days, type) {
  const now = Date.now();
  const dates = Array.from({ length: days + 1 }, (_, index) => day(now - index * dayMs));
  const startOfDay = Date.parse(dates[days - 1] + 'T00:00:00+09:00');
  const { rows } = await query(
    'select id, participant, interview_type, topic, started_at, baseline_id, summary ' +
    'from roleplay_metrics.interview_sessions where started_at >= $1 and started_at <= $2 ' +
    'and (interview_type = \'counseling\' or $3 = \'all\' or interview_type = $3) order by started_at, id limit 20001',
    [new Date(startOfDay - dayMs), new Date(now), type]
  );
  if (rows.length > 20000) return null;
  const entries = [];
  const counseling = Object.fromEntries(counselingTopics.map(topic => [topic, []]));
  const completed = new Map();
  for (const row of rows) {
    const startedAt = row.started_at.getTime();
    if (row.summary) completed.set(row.id, row.summary);
    if (startedAt < startOfDay) continue;
    const session = { id: row.id, participant: row.participant, startedAt,
      baseline: row.baseline_id ? { id: row.baseline_id } : null };
    if (row.interview_type === 'counseling') counseling[row.topic]?.push(session);
    else entries.push({ ...session, type: row.interview_type });
  }

  return { days, type, ...summarize(entries, completed, now),
    interviews: Object.fromEntries(['job', 'college'].filter(key => type === 'all' || key === type).map(key => {
      const group = entries.filter(session => session.type === key);
      const results = group.map(session => completed.get(session.id)).filter(Boolean);
      return [key, { participants: new Set(group.map(session => session.participant)).size,
        started: group.length, completed: results.length, score: measure(results.map(result => result.score)),
        components: Object.fromEntries([...'PROVE'].map(letter => [letter,
          measure(results.map(result => result.prove?.[letter]?.percent).filter(Number.isFinite))])) }];
    })),
    counseling: Object.fromEntries(counselingTopics.map(topic => [topic, summarizeCounseling(counseling[topic], completed)])),
    daily: dates.slice(0, days).map(date => {
      const sessions = entries.filter(session => day(session.startedAt) === date);
      return { date, started: sessions.length, completed: sessions.filter(session => completed.has(session.id)).length };
    }) };
}
