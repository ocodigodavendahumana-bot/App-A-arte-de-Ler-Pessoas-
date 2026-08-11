const { kv } = require('@vercel/kv');
const crypto = require('crypto');
const { requireSession } = require('./_lib/auth');

const KEY = 'clients_db';
const MAX_LEN = 4000; // limite simples de tamanho por campo, evita abuso

function sanitizeClient(input) {
  const s = (v) => (v === undefined || v === null ? '' : String(v).slice(0, MAX_LEN));
  return {
    nome: s(input.nome).trim(),
    data: s(input.data).trim(),
    tel: s(input.tel).trim(),
    email: s(input.email).trim(),
    perfil1: s(input.perfil1).trim(),
    perfil2: s(input.perfil2).trim(),
    funil: s(input.funil).trim(),
    obs: s(input.obs).trim(),
  };
}

module.exports = async (req, res) => {
  const session = requireSession(req, res);
  if (!session) return; // requireSession já respondeu com 401/403

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  if (req.method === 'GET') {
    const clients = (await kv.get(KEY)) || [];
    res.status(200).json({ clients });
    return;
  }

  if (req.method === 'POST') {
    if (!body?.nome || !String(body.nome).trim()) {
      res.status(400).json({ error: 'Nome do cliente é obrigatório' });
      return;
    }
    const clients = (await kv.get(KEY)) || [];
    const client = { id: crypto.randomUUID(), ...sanitizeClient(body) };
    clients.unshift(client);
    await kv.set(KEY, clients);
    res.status(201).json({ client, clients });
    return;
  }

  if (req.method === 'PUT') {
    const id = body?.id;
    if (!id) { res.status(400).json({ error: 'id é obrigatório' }); return; }
    const clients = (await kv.get(KEY)) || [];
    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) { res.status(404).json({ error: 'Cliente não encontrado' }); return; }
    clients[idx] = { ...clients[idx], ...sanitizeClient(body), id };
    await kv.set(KEY, clients);
    res.status(200).json({ client: clients[idx], clients });
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || body?.id;
    if (!id) { res.status(400).json({ error: 'id é obrigatório' }); return; }
    let clients = (await kv.get(KEY)) || [];
    clients = clients.filter((c) => c.id !== id);
    await kv.set(KEY, clients);
    res.status(200).json({ clients });
    return;
  }

  res.status(405).json({ error: 'Método não permitido' });
};
