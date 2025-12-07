import { Request, Response, NextFunction } from 'express';
import { verifySession, JWTPayload } from '../services/sessionService';
import { APIError } from './errorHandler';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError(401, 'Authorization token required');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySession(token);

  if (!payload) {
    throw new APIError(401, 'Invalid or expired token');
  }

  req.user = payload;
  next();
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifySession(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
};
