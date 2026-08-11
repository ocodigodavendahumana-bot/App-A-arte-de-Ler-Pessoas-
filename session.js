const { getSession } = require('./_lib/auth');

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.status(200).json({ authenticated: false });
    return;
  }
  res.status(200).json({
    authenticated: true,
    nome: session.nome,
    email: session.email,
    isAdmin: !!session.isAdmin,
  });
};
