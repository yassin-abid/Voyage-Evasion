import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to verify JWT token and check if user is admin
export const verifyAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user and check if admin
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
