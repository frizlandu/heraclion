// Middleware de contrôle de rôle
function authorizeRoles(...roles) {
  return (req, res, next) => {
  if (!req.user || !roles.map(r => r.toLowerCase()).includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit : permissions insuffisantes'
      });
    }
    next();
  };
}

module.exports = authorizeRoles;
