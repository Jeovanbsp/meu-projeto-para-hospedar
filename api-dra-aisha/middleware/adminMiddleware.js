// Arquivo: /middleware/adminMiddleware.js

const adminMiddleware = (req, res, next) => {
  // (Isso roda DEPOIS do authMiddleware)
  // req.user foi definido pelo "guarda" anterior (authMiddleware)

  if (req.user && req.user.role === 'admin') {
    // Se o usuário é admin, pode passar.
    next();
  } else {
    // Se não for admin, barra a entrada.
    return res.status(403).json({ message: 'Acesso negado. Requer permissão de Administrador.' });
  }
};

module.exports = adminMiddleware;