import express from 'express';
import { getDB } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user profile by username
router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    
    const result = await db.query(
      'SELECT user_id, username, email, bio, profile_picture_url, created_at FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user profile' 
    });
  }
});

// Update user profile (only your own)
router.put('/:username', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    const { email, bio, profile_picture_url } = req.body;
    
    // Check if user is updating their own profile
    if (req.user?.username !== username) {
      return res.status(403).json({ error: 'Not authorized to edit this profile' });
    }
    
    const result = await db.query(
      'UPDATE users SET email = $1, bio = $2, profile_picture_url = $3 WHERE username = $4 RETURNING user_id, username, email, bio, profile_picture_url, created_at',
      [email, bio, profile_picture_url || null, username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile' 
    });
  }
});

// Follow a user
router.post('/:username/follow', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usernameToFollow = req.params.username;
    
    // Get follower's user_id (current user)
    const followerResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (followerResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const followerId = followerResult.rows[0].user_id;
    
    // Get following user_id (user to follow)
    const followingResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [usernameToFollow]
    );
    
    if (followingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User to follow not found' });
    }
    
    const followingId = followingResult.rows[0].user_id;
    
    // Can't follow yourself
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Insert follow relationship (ON CONFLICT DO NOTHING prevents duplicates)
    await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT (follower_id, following_id) DO NOTHING',
      [followerId, followingId]
    );
    
    res.json({
      success: true,
      message: `Now following ${usernameToFollow}`
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to follow user' 
    });
  }
});

// Unfollow a user
router.delete('/:username/follow', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usernameToUnfollow = req.params.username;
    
    // Get follower's user_id (current user)
    const followerResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (followerResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const followerId = followerResult.rows[0].user_id;
    
    // Get following user_id (user to unfollow)
    const followingResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [usernameToUnfollow]
    );
    
    if (followingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const followingId = followingResult.rows[0].user_id;
    
    // Delete follow relationship
    const result = await db.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }
    
    res.json({
      success: true,
      message: `Unfollowed ${usernameToUnfollow}`
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unfollow user' 
    });
  }
});

// Get user's followers
router.get('/:username/followers', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    
    // Get user_id
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Get followers
    const result = await db.query(
      `SELECT u.user_id, u.username, u.bio, u.profile_picture_url 
       FROM follows f 
       JOIN users u ON f.follower_id = u.user_id 
       WHERE f.following_id = $1`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve followers' 
    });
  }
});

// Get users that this user is following
router.get('/:username/following', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    
    // Get user_id
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Get following
    const result = await db.query(
      `SELECT u.user_id, u.username, u.bio, u.profile_picture_url 
       FROM follows f 
       JOIN users u ON f.following_id = u.user_id 
       WHERE f.follower_id = $1`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve following list' 
    });
  }
});

// Get user's posts
router.get('/:username/posts', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    
    // Get user_id
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Get all posts for this user
    const result = await db.query(
      'SELECT id, user_id, content, image_url, post_type, created_at FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve posts' 
    });
  }
});

// Get current authenticated user's profile
router.get('/me/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    
    // req.user.username comes from the JWT token
    const result = await db.query(
      'SELECT user_id, username, email, bio, profile_picture_url, created_at FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user profile' 
    });
  }
});

export default router;