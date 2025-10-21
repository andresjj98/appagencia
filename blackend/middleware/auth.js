const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticacion requerido' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      officeId: decoded.officeId ?? null,
      isSuperAdmin: Boolean(decoded.isSuperAdmin)
    };

    next();
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(403).json({ error: 'Token invalido o expirado' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta accion',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};