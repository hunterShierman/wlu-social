import express from 'express';
import { getDB } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all comments for a specific post
router.get('/posts/:postId/comments', async (req, res) => {
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
    
    // Get all comments for this post with user info
    const result = await db.query(
      `SELECT c.id, c.content, c.created_at, c.user_id,
              u.username, u.profile_picture_url
       FROM comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve comments' 
    });
  }
});

// Create a comment on a post
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;
    const { content } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
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
    
    // Insert comment
    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, userId, content]
    );
    
    res.status(201).json({
      success: true,
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create comment' 
    });
  }
});

// Get a specific comment
router.get('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const commentId = req.params.id;
    
    const result = await db.query(
      `SELECT c.id, c.post_id, c.content, c.created_at, c.user_id,
              u.username, u.profile_picture_url
       FROM comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.id = $1`,
      [commentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve comment' 
    });
  }
});

// Update a comment (only your own)
router.put('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const commentId = req.params.id;
    const { content } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
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
    
    // Check if comment exists and belongs to user
    const commentCheck = await db.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [commentId]
    );
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }
    
    // Update comment
    const result = await db.query(
      `UPDATE comments 
       SET content = $1 
       WHERE id = $2 
       RETURNING id, post_id, user_id, content, created_at`,
      [content, commentId]
    );
    
    res.json({
      success: true,
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update comment' 
    });
  }
});

// Delete a comment (only your own)
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const commentId = req.params.id;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if comment exists and belongs to user
    const commentCheck = await db.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [commentId]
    );
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Delete comment
    await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete comment' 
    });
  }
});

// Get comment count for a post
router.get('/posts/:postId/comments/count', async (req, res) => {
  try {
    const db = getDB();
    const postId = req.params.postId;
    
    const result = await db.query(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = $1',
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
      error: 'Failed to get comment count' 
    });
  }
});

export default router;