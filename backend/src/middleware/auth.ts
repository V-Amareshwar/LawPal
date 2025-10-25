import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const verifyToken: RequestHandler = (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Checking token...');
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided or invalid format');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted (first 20 chars):', token.substring(0, 20) + '...');

    jwt.verify(token, JWT_SECRET, (err: unknown, decoded: any) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Verification error';
        console.log('❌ Token verification failed:', msg);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      console.log('✅ Token verified, userId:', decoded.userId);
      req.user = { userId: decoded.userId };
      next();
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};
