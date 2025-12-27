import express from 'express';
import { connectDB } from './config/database';
import { config } from './config/env';
import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express';
import type { user, UserPayload } from './types/express';

const app = express();

// Middleware
app.use(express.json());


const posts = [
  {
    username: 'kyle',
    title: 'Post 1'
  },
  {
    username: 'hunter',
    title: 'Post 2'
  }
]

app.get('/posts', authenticateToken, (req, res) => {
  res.json(posts.filter(post => post.username === req.user?.username))
})

// Test database route
app.get('/api/test-db', async (req, res) => {
  try {
    const { getDB } = await import('./config/database');
    const db = getDB();
    const result = await db.query('SELECT * FROM clubs');
    res.json({ 
      success: true, 
      timestamp: result.rows[0].now,
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed'
    });
  }
});

// Connect to database and start server
const startServer = async () => {
  await connectDB();
  
  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  });
};

function authenticateToken(req: Request, res: Response, next: NextFunction) {
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


startServer();