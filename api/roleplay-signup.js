import { createClient } from '@supabase/supabase-js';
import { allowRoleplaySignup } from '../lib/interview-analytics.mjs';
import { isInternalRoleplayEmail, normalizeEmail, roleplayLoginEmail } from '../lib/roleplay-account.mjs';

const userTypes = new Set(['job-seeker', 'university', 'high-school', 'teacher', 'coach', 'nutritionist', 'other']);
const practiceTypes = new Set(['job', 'college', 'school', 'career', 'nutrition']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }
  const { email, password, profile } = req.body ?? {};
  const address = normalizeEmail(email);
  const nickname = typeof profile?.nickname === 'string' ? profile.nickname.trim() : '';
  const { phone, user_type: userType, practice_type: practiceType } = profile ?? {};
  if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || isInternalRoleplayEmail(address) ||
      typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72 ||
      nickname.length < 2 || nickname.length > 30 || typeof phone !== 'string' || !/^\+?[0-9]{8,15}$/.test(phone) ||
      !userTypes.has(userType) || !practiceTypes.has(practiceType)) {
    return res.status(400).json({ error: '가입 정보를 확인해 주세요. 비밀번호는 8자 이상, 영문 기준 72자 이내로 입력해 주세요.' });
  }
  try {
    const key = process.env.ROLEPLAY_SUPABASE_ADMIN_KEY;
    if (!key) throw new Error('Missing signup configuration');
    if (!await allowRoleplaySignup(req.headers['x-vercel-forwarded-for'])) {
      return res.status(429).json({ error: '가입 요청이 많습니다. 잠시 뒤 다시 시도해 주세요.' });
    }
    const client = createClient('https://xwpxulvywjthliphjuie.supabase.co', key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await client.auth.admin.createUser({
      email: await roleplayLoginEmail(address),
      email_confirm: true,
      password,
      user_metadata: { roleplay_signup_profile_v1: {
        phone, nickname, user_type: userType, practice_type: practiceType, contact_email: address
      } }
    });
    if (error) {
      if (error.code === 'email_exists' || error.code === 'user_already_exists') {
        return res.status(409).json({ error: '이미 가입한 이메일입니다. 로그인해 주세요.' });
      }
      if (error.code === 'weak_password') return res.status(400).json({ error: '더 강한 비밀번호를 사용해 주세요.' });
      console.warn('[roleplay-signup] Auth createUser failed', error.code ?? error.status);
      throw new Error('Signup request failed');
    }
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(503).json({ error: '지금은 가입할 수 없습니다. 잠시 뒤 다시 시도해 주세요.' });
  }
}
