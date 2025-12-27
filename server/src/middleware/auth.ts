// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { Request, Response, NextFunction } from 'express';
import type { UserPayload } from '../types/express';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded as UserPayload;
    next();
  });
}