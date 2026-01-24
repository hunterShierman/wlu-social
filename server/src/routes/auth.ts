// src/routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { getDB } from '../config/database.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import type { user } from '../types/express.js';
import type { UserPayload } from '../types/express.js';
import { sendVerificationEmail } from '../utils/email.js';
import crypto from 'crypto';

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
  return jwt.sign(user, config.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
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
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDB();

  try {
    // Find user
    const result = await db.query(
      'SELECT user_id, username, email, password, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Account does not exist' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect Password' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email
      });
    }

    // Generate tokens (your existing logic)
    const accessToken = generateAccessToken({ username: user.username });
    const refreshToken = jwt.sign(
      { username: user.username },
      config.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const curDate = new Date();

    await db.query(
      'INSERT INTO refresh_tokens (token, expires_at, created_at, username) VALUES ($1, $2, $3, $4)',
      [refreshToken, expiresAt, curDate, user.username]
    );

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// POST /auth/signup - Create new user
router.post('/signup', signupRateLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Your original password validation
    const validationError = validPassword(password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const db = getDB();

    // Check if username already exists
    const existingUsername = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists
    const existingEmail = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password (your original logic)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token (32 random bytes)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 24 hours
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    // Create user (unverified) - includes email fields
    const result = await db.query(
      `INSERT INTO users (
        username, 
        email, 
        password, 
        email_verified, 
        verification_token,
        verification_token_expires,
        created_at
      )
      VALUES ($1, $2, $3, FALSE, $4, $5, NOW())
      RETURNING user_id, username, email`,
      [username, email, hashedPassword, verificationToken, tokenExpires]
    );

    const newUser = result.rows[0];

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, username);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Still create account, but inform user
      return res.status(201).json({
        success: true,
        message: 'Account created, but verification email failed to send. Please contact support.',
        userId: newUser.user_id,
      });
    }

    // ✅ SUCCESS: Account created, email sent
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      userId: newUser.user_id,
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

// GET /auth/verify-email - Verify user's email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const db = getDB();

  try {
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Find user with this token
    const result = await db.query(
      `SELECT user_id, username, email, verification_token_expires 
       FROM users 
       WHERE verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token' 
      });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({ 
        error: 'Verification token has expired. Please request a new one.' 
      });
    }

    // Verify the user
    await db.query(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE user_id = $1`,
      [user.user_id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      username: user.username,
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /auth/resend-verification - Resend verification email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  const db = getDB();

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const result = await db.query(
      `SELECT user_id, username, email, email_verified 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not (security)
      return res.json({ 
        success: true,
        message: 'If that email is registered and unverified, a new verification email has been sent.' 
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'Email is already verified. Please log in.' 
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    // Update user with new token
    await db.query(
      `UPDATE users 
       SET verification_token = $1,
           verification_token_expires = $2
       WHERE user_id = $3`,
      [verificationToken, tokenExpires, user.user_id]
    );

    // Send email
    await sendVerificationEmail(email, verificationToken, user.username);

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Export cleanup function to be called from main server
export { cleanupExpiredTokens };
export default router;