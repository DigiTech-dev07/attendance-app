import jwt from 'jsonwebtoken';
import dbStore from '../services/dbStore.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'dg_tech_offsite_2026_super_secure_jwt_secret_key_antigravity';

    const decoded = jwt.verify(token, secret);

    // If it's an admin token
    if (decoded.role === 'admin') {
      req.user = {
        id: decoded.id || 'admin_root',
        name: decoded.name || 'Offsite Administrator',
        email: decoded.email || process.env.ADMIN_EMAIL || 'admin@dgtech.com',
        role: 'admin',
      };
      return next();
    }

    // Normal employee user
    const user = await dbStore.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session not found or expired. Please log in again.',
      });
    }

    req.user = {
      id: user.id || user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'employee',
      avatar: user.avatar || '',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
      error: error.message,
    });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to event administrators only.',
    });
  }
  next();
}
