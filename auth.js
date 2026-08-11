const crypto = require('crypto');

const COOKIE_NAME = 'vh_session';
const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET não configurado nas variáveis de ambiente da Vercel.');
  }
  return secret;
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

function createSessionCookie(data) {
  const payload = { ...data, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(payloadB64);
  const token = `${payloadB64}.${sig}`;
  const maxAge = SESSION_HOURS * 60 * 60;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

// Retorna a sessão válida (objeto) ou null.
function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  // Comparação em tempo constante
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

// Middleware simples: exige sessão válida. Se admin=true, exige também isAdmin.
function requireSession(req, res, { admin = false } = {}) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Não autenticado. Faça login novamente.' });
    return null;
  }
  if (admin && !session.isAdmin) {
    res.status(403).json({ error: 'Acesso restrito ao administrador.' });
    return null;
  }
  return session;
}

module.exports = { createSessionCookie, clearSessionCookie, getSession, requireSession, COOKIE_NAME };
