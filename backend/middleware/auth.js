const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Allow OPTIONS requests to pass through for CORS preflight
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth failed - No token or invalid format');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', { id: decoded.id, role: decoded.role });
    
    if (!decoded.role) {
      console.log('No role found in token');
      return res.status(401).json({ error: 'Invalid token: no role specified' });
    }
    
    // Store the full decoded token in req.user
    req.user = decoded;
    
    // Add role to response headers for debugging
    res.setHeader('X-User-Role', decoded.role);
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin };
