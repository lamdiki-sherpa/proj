// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const parseBearer = (authHeader = '') => {
  if (typeof authHeader !== 'string') return null;
  const lower = authHeader.toLowerCase();
  if (!lower.startsWith('bearer ')) return null;
  return authHeader.slice(7).trim();
};

exports.verifyToken = async (req, res, next) => {
  try {
    const token = parseBearer(req.headers.authorization);
    if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.suspended) return res.status(403).json({ message: 'Account suspended. Contact support.' });

    req.user = user; // full user doc (password is not selected by default)
    return next();
  } catch (err) {
    console.error('Token verification error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient role' });
    }
    next();
  };
};

exports.requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Not a super admin.' });
  }
  next();
};
