const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For superadmin check
    if (requiredRole === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin privileges required' });
    }

    // For admin check (either admin or superadmin can access)
    if (requiredRole === 'admin' && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    next();
  };
};

module.exports = checkRole;
