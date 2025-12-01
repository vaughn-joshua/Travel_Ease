import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Get secret from env or use a default for dev
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';

interface JwtPayload {
  id: number;
  email?: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: user.id, email: user.email || '' };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

