import { recordUsage, readUsage, analyticsConfigured, isAnalyticsAdmin, readAnalytics, verifyAnalyticsPin } from '../lib/interview-analytics.mjs';

import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

function sessionSignature(payload) {
  return createHmac('sha256', process.env.INTERVIEW_ADMIN_TOKEN)
    .update('dashboard-session:' + payload).digest('base64url');
}

function validSession(value) {
  if (!analyticsConfigured() || typeof value !== 'string') return false;
  const match = /^(\d{13}\.[0-9a-f-]{36})\.([\w-]{43})$/.exec(value);
  return Boolean(match && Number(match[1].split('.')[0]) > Date.now() &&
    timingSafeEqual(Buffer.from(match[2]), Buffer.from(sessionSignature(match[1]))));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST') {
    if (!['visit', 'install'].includes(req.body?.event) || !req.headers.origin ||
        req.headers.origin !== 'https://' + req.headers.host) return res.status(400).end();
    try {
      await recordUsage(req.body.event);
      return res.status(204).end();
    } catch { return res.status(503).end(); }
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET 요청만 지원합니다.' });
  }
  if (req.query?.status === 'availability') return res.status(200).json({ enabled: analyticsConfigured() });
  const resumed = validSession(req.headers['x-dashboard-session']);
  if (!resumed && !isAnalyticsAdmin(req.headers.authorization)) {
    try {
      const result = await verifyAnalyticsPin(req.headers.authorization, req.headers['x-vercel-forwarded-for']);
      if (result === 'limited') return res.status(429).json({ error: '접속 시도 한도를 초과했습니다. 다음 시간대에 다시 시도해 주세요.' });
      if (result !== 'ok') return res.status(401).json({ error: '관리자 비밀번호를 확인해 주세요.' });
    } catch {
      return res.status(503).json({ error: '관리자 비밀번호를 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.' });
    }
  }
  if (!analyticsConfigured()) return res.status(503).json({ error: '운영 집계 저장소가 연결되지 않았습니다.' });
  const days = Number(req.query?.days ?? 7);
  const type = req.query?.type ?? 'all';
  if (![1, 7, 30].includes(days) || !['all', 'job', 'college'].includes(type)) {
    return res.status(400).json({ error: '기간과 면접 유형을 확인해 주세요.' });
  }
  try {
    const report = await readAnalytics(days, type);
    if (report && !resumed) {
      const payload = (Date.now() + 8 * 3600000) + '.' + randomUUID();
      res.setHeader('X-Dashboard-Session', payload + '.' + sessionSignature(payload));
    }
    return report ? res.status(200).json({ ...report, usage: await readUsage() })
      : res.status(422).json({ error: '선택한 기간의 기록이 너무 많습니다. 더 짧은 기간을 선택해 주세요.' });
  } catch {
    return res.status(503).json({ error: '집계 저장소에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.' });
  }
}
