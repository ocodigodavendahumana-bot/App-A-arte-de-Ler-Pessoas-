const { kv } = require('@vercel/kv');
const { createSessionCookie } = require('./_lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ocodigodavendahumana@gmail.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const nome = (body?.nome || '').toString().trim().slice(0, 120);
  const email = (body?.email || '').toString().trim().toLowerCase().slice(0, 160);
  const password = (body?.password || '').toString();

  if (!nome) { res.status(400).json({ error: 'Informe seu nome' }); return; }
  if (!email || !email.includes('@')) { res.status(400).json({ error: 'Informe um e-mail válido' }); return; }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    res.status(500).json({ error: 'ADMIN_PASSWORD não configurado no servidor.' });
    return;
  }
  if (password !== expectedPassword) {
    res.status(401).json({ error: 'Senha de acesso incorreta.' });
    return;
  }

  const isAdmin = email === ADMIN_EMAIL;

  // Registra o acesso (best-effort)
  try {
    const log = (await kv.get('access_log')) || [];
    if (!log.find((c) => c.email === email)) {
      log.unshift({ nome, email, accessedAt: new Date().toISOString() });
      await kv.set('access_log', log);
    }
  } catch (e) {
    // não bloqueia o login se o log falhar
  }

  const cookie = createSessionCookie({ nome, email, isAdmin });
  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ ok: true, nome, email, isAdmin });
};
