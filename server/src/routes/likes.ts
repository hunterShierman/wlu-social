import express from 'express';
import { getDB } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Like a post
router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;
    
    // Check if post exists
    const postCheck = await db.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Insert like (ON CONFLICT prevents duplicate likes)
    const result = await db.query(
      `INSERT INTO likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING id, user_id, post_id, created_at`,
      [userId, postId]
    );
    
    // If result is empty, like already existed
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Post already liked'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Post liked successfully',
      like: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to like post' 
    });
  }
});

// Unlike a post
router.delete('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Delete like
    const result = await db.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }
    
    res.json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unlike post' 
    });
  }
});

// Get all likes for a post (with user info)
router.get('/posts/:postId/likes', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;
    
    // Check if post exists
    const postCheck = await db.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Get all likes with user info
    const result = await db.query(
      `SELECT l.id, l.created_at, l.user_id,
              u.username, u.profile_picture_url
       FROM likes l
       JOIN users u ON l.user_id = u.user_id
       WHERE l.post_id = $1
       ORDER BY l.created_at DESC`,
      [postId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve likes' 
    });
  }
});

// Get like count for a post
router.get('/posts/:postId/count', async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;
    
    const result = await db.query(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
      [postId]
    );
    
    res.json({
      post_id: postId,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get like count' 
    });
  }
});

// Check if current user has liked a post
router.get('/posts/:postId/me', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;

    console.log(postId);

    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if like exists
    const result = await db.query(
      'SELECT id, created_at FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );
    
    res.json({
      liked: result.rows.length > 0,
      like: result.rows[0] || null
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check like status' 
    });
  }
});

// Get all posts liked by current user
router.get('/likes/me', authenticateToken, async (req, res) => {
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
    
    // Get all posts this user has liked
    const result = await db.query(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.created_at,
              l.created_at as liked_at,
              u.username
       FROM likes l
       JOIN posts p ON l.post_id = p.id
       JOIN users u ON p.user_id = u.user_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve liked posts' 
    });
  }
});

// Get all posts liked by a specific user
router.get('/users/:username/likes', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Get all posts this user has liked
    const result = await db.query(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.created_at,
              l.created_at as liked_at,
              u.username
       FROM likes l
       JOIN posts p ON l.post_id = p.id
       JOIN users u ON p.user_id = u.user_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve liked posts' 
    });
  }
});

export default router;