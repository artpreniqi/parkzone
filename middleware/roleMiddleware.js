function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== roleName) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireRole };
