import express from 'express';
import { config } from './config/env';
import jwt from 'jsonwebtoken';
import type { user } from './types/express';
import * as bcrypt from 'bcrypt';
import { connectDB, getDB } from './config/database';

const app = express();

// Middleware
app.use(express.json());

// create new jwt token
app.post('/token', async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);

  // check to see if there is a matching valid refresh token in the database
  try {
    const db = getDB();
    const result = await db.query('SELECT token FROM refresh_tokens WHERE token = $1', [refreshToken]);
    if (result.rows.length == 0) {
      return res.sendStatus(403);
    }

    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
    
      // all checks passed, therefore valid so generate a new access token using this refresh token
      const accessToken = generateAccessToken({ username: result.rows[0].username });
      res.json({ accessToken: accessToken });
    });
  }
  catch(err) {
    console.error('Database error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Database connection failed' 
    });
  }
});

// log out the user using jwt tokens
app.delete('/logout', async (req, res) => {
  try {
    const db = getDB();
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [req.body.token]);
    console.log('refresh token deleted');
    return res.send('success! refreshed token deleted');
  }
  catch(err) {
    console.error('Database error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Database connection failed' 
    });
  }
});

// login route and use JWT session authentication
app.post('/login', async (req, res) => {
  // authenticate user 
  let user: user | null = null;

  // check to see if username exists in the database
  try {
    const db = getDB();
    const queryResult = await db.query<user>('SELECT username, password FROM users WHERE username = $1', [req.body.username]);
    user = queryResult.rows[0] || null;
  } 
  catch(err) {
    console.error('Database error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Database connection failed' 
    });
  }

  // user was not found
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // check if the password entered matches the password associated with the matching account in the database
  try {
    if (await bcrypt.compare(req.body.password, user.password!)) {
      console.log('user is now signed in')
      
      // Only generate tokens if password is correct
      const accessToken = generateAccessToken({ username: user.username! })
      const refreshToken = jwt.sign({ username: user.username! }, config.REFRESH_TOKEN_SECRET)
      
      // after logging in create a refresh token in the database
      try {
        const db = getDB();
        const expiresAt = new Date()
        const curDate = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.query('INSERT INTO refresh_tokens (token, expires_at, created_at, username) VALUES ($1, $2, $3, $4)' , [refreshToken, expiresAt, curDate, user.username]);
      } 
      catch(err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database connection failed' 
        });
      }

      return res.json({ accessToken: accessToken, refreshToken: refreshToken })
    } else {
      return res.status(401).send('invalid password')
    }
  } 
  catch {
    return res.status(500).send()
  }
})

// create a new user account with password 
app.post('/signup', async (req, res) => {
  try {

    // Validate password before hashing
    const validationError = validPassword(req.body.password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user: user = { username: req.body.username, password: hashedPassword};

    try {
      const db = getDB();
      await db.query('INSERT INTO users (password, username) VALUES ($1, $2)', [user.password, user.username]);
    } 
    catch(err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed' 
      });
    }

    res.send(`user ${user.username} added succesfully`)

  } catch {
    res.status(500).send()
  }
})

// Add this test route
app.get('/', (req, res) => {
  res.json({ message: 'Auth server is alive!' });
}); 

function generateAccessToken(user: { username: string }) {
  return jwt.sign(user, config.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

function validPassword(password: string): string | null {
  // ALWAYS validate on backend
  if (password.length < 4) {
    return 'Password must be at least 4 characters';
  }
  
  // if (!/[A-Z]/.test(password)) {
  //   return 'Password must contain at least one uppercase letter';
  // }

  // if (!/[a-z]/.test(password)) {
  //   return 'Password must contain at least one lowercase letter';
  // }

  // if (!/[0-9]/.test(password)) {
  //   return 'Password must contain at least one number';
  // }

  return null; // Password is valid
}

// start server
const startServer = async () => {
  await connectDB();

  app.listen(3000, () => {
    console.log(`🚀 authentication running on http://localhost:3000`);
  });
};

startServer()

