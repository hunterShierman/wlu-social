import express from 'express';
import { connectDB, getDB } from './config/database';
import { config } from './config/env';
import type { Request, Response, NextFunction } from 'express';
import type { user, UserPayload } from './types/express';
import { authenticateToken } from './middleware/auth';

const app = express();

// Middleware
app.use(express.json());

// Get all posts for the authenticated user
app.get('/posts', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Get all posts for this user
    const postsResult = await db.query(
      'SELECT * FROM posts WHERE user_id = $1',
      [userId]
    );
    
    res.json(postsResult.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve posts' 
    });
  }
});

// Create a new post
app.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { content, image_url, post_type } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!post_type) {
      return res.status(400).json({ error: 'Post type is required' });
    }
    
    const db = getDB();
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Insert new post
    const result = await db.query(
      'INSERT INTO posts (user_id, content, image_url, post_type) VALUES ($1, $2, $3, $4) RETURNING id, user_id, content, image_url, post_type',
      [userId, content, image_url || null, post_type]
    );
    
    res.status(201).json({
      success: true,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create post' 
    });
  }
});

// Get a specific post by ID
app.get('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.id;
    
    const result = await db.query(
      'SELECT id, user_id, content, image_url, post_type, created_at FROM posts WHERE id = $1',
      [postId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve post' 
    });
  }
});

// Update a post
app.put('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { content, image_url, post_type } = req.body;
    const postId = req.params.id;
    const db = getDB();
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if post exists and belongs to user
    const postCheck = await db.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }
    
    // Update post
    const result = await db.query(
      'UPDATE posts SET content = $1, image_url = $2, post_type = $3 WHERE id = $4 RETURNING id, user_id, content, image_url, post_type, created_at',
      [content, image_url || null, post_type, postId]
    );
    
    res.json({
      success: true,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update post' 
    });
  }
});

// Delete a post
app.delete('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const db = getDB();
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if post exists and belongs to user
    const postCheck = await db.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    // Delete post
    await db.query('DELETE FROM posts WHERE id = $1', [postId]);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete post' 
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

startServer();