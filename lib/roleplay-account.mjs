const internalDomain = '@roleplay-ai-coach.invalid';

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isInternalRoleplayEmail(email) {
  return normalizeEmail(email).endsWith(internalDomain);
}

export async function roleplayLoginEmail(email) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeEmail(email)));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('') + internalDomain;
}
