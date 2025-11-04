// Arquivo: /middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

// Este é o nosso "Guarda de Segurança"
const authMiddleware = (req, res, next) => {
  // 1. Pega o "crachá" (token) do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  // 2. Verifica se o crachá existe
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  // 3. Extrai o token (vem no formato "Bearer [token]")
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verifica se o crachá é válido (usando nosso segredo)
    const decoded = jwt.verify(token, jwtSecret);

    // 5. Se for válido, anexa o ID do usuário na requisição
    req.user = decoded; // Agora sabemos quem está logado (req.user.userId)
    next(); // Deixa a requisição continuar para a rota

  } catch (error) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;