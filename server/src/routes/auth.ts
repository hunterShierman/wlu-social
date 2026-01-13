// src/routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { getDB } from '../config/database';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import type { user } from '../types/express';
import type { UserPayload } from '../types/express';

const router = express.Router();

// Rate limiting for login - 5 attempts per 15 minutes per IP
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for signup - 3 attempts per 15 minutes per IP
const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many registration attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function
function generateAccessToken(user: UserPayload) {
  return jwt.sign(user, config.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function validPassword(password: string): string | null {
  if (password.length < 4) {
    return 'Password must be at least 4 characters';
  }
  return null;
}

// POST /auth/token - Refresh access token
router.post('/token', async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);

  try {
    const db = getDB();
    const result = await db.query(
      'SELECT token, username FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    
    if (result.rows.length == 0) {
      return res.sendStatus(403);
    }

    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      
      const accessToken = generateAccessToken({ username: result.rows[0].username });
      res.json({ accessToken: accessToken });
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed'
    });
  }
});

// DELETE /auth/logout - Logout user
router.delete('/logout', async (req, res) => {
  try {
    const db = getDB();
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [req.body.token]);
    console.log('refresh token deleted');
    return res.send('success! refreshed token deleted');
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed'
    });
  }
});

// POST /auth/login - Login user
router.post('/login', loginRateLimiter, async (req, res) => {
  let user: user | null = null;

  try {
    const db = getDB();
    const queryResult = await db.query<user>(
      'SELECT username, password FROM users WHERE username = $1',
      [req.body.username]
    );
    user = queryResult.rows[0] || null;
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed'
    });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      console.log('user is now signed in');

      const payload: UserPayload = { username: user.username };
      const accessToken = generateAccessToken(payload);
      const refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

      const db = getDB();
      const expiresAt = new Date();
      const curDate = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.query(
        'INSERT INTO refresh_tokens (token, expires_at, created_at, username) VALUES ($1, $2, $3, $4)',
        [refreshToken, expiresAt, curDate, user.username]
      );

      return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
      return res.status(401).send('invalid password');
    }
  } catch {
    return res.status(500).send();
  }
});

// POST /auth/signup - Create new user
router.post('/signup', signupRateLimiter, async (req, res) => {
  try {
    const validationError = validPassword(req.body.password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user: user = { username: req.body.username, password: hashedPassword };

    const db = getDB();
    await db.query(
      'INSERT INTO users (password, username) VALUES ($1, $2)',
      [user.password, user.username]
    );

    // Auto-login: Generate tokens
    const accessToken = generateAccessToken({ username: user.username! });
    const refreshToken = jwt.sign(
      { username: user.username! },
      config.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const curDate = new Date();

    await db.query(
      'INSERT INTO refresh_tokens (token, expires_at, created_at, username) VALUES ($1, $2, $3, $4)',
      [refreshToken, expiresAt, curDate, user.username!]
    );

    return res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: `user ${user.username} added successfully`
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Clean up expired refresh tokens
async function cleanupExpiredTokens(): Promise<number> {
  try {
    const db = getDB();
    const result = await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired refresh token(s)`);
    }

    return deletedCount;
  } catch (err) {
    console.error('Error cleaning up expired tokens:', err);
    return 0;
  }
}

// Export cleanup function to be called from main server
export { cleanupExpiredTokens };
export default router;