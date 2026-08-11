const { kv } = require('@vercel/kv');
const { requireSession } = require('./_lib/auth');

module.exports = async (req, res) => {
  const session = requireSession(req, res, { admin: true });
  if (!session) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const log = (await kv.get('access_log')) || [];
  res.status(200).json({ log });
};
