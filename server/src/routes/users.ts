import express from 'express';
import { getDB } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    
    const result = await db.query(
      'SELECT user_id, username, email, bio, profile_picture_url, created_at, program FROM users WHERE username = $1',
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

// Get user stats (followers count, following count)
router.get('/:username/stats', async (req, res) => {
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
    
    // Get followers count
    const followersResult = await db.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [userId]
    );
    
    // Get following count
    const followingResult = await db.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [userId]
    );
    
    res.json({
      followers: parseInt(followersResult.rows[0].count),
      following: parseInt(followingResult.rows[0].count)
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user stats' 
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
router.get('/:username/posts', async (req, res) => {
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
    
    // JOIN with users table to get username, profile_picture_url, and program
    const result = await db.query(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.created_at,
              u.username, u.profile_picture_url, u.program
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC`,
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
      'SELECT user_id, username, email, bio, profile_picture_url, created_at, program FROM users WHERE username = $1',
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

// Check if current user is following a specific user
router.get('/:username/follow/status', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usernameToCheck = req.params.username;
    
    // Get current user's user_id
    const currentUserResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'Current user not found' });
    }
    
    const currentUserId = currentUserResult.rows[0].user_id;
    
    // Get target user's user_id
    const targetUserResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [usernameToCheck]
    );
    
    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const targetUserId = targetUserResult.rows[0].user_id;
    
    // Check if follow relationship exists
    const followResult = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [currentUserId, targetUserId]
    );
    
    res.json({
      isFollowing: followResult.rows.length > 0
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check follow status' 
    });
  }
});

// Get complete user profile data (profile + stats + posts) in one call to speed up profile load time
router.get('/:username/complete', async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    const limit = parseInt(req.query.limit as string) || 2; // Default to 2
    const offset = parseInt(req.query.offset as string) || 0;    

    // Get user profile
    const userResult = await db.query(
      'SELECT user_id, username, email, bio, profile_picture_url, program, created_at FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const userId = user.user_id;

    // Get total post count
    const totalPostsResult = await db.query(
      'SELECT COUNT(*) FROM posts WHERE user_id = $1',
      [userId]
    );

    const totalPosts = parseInt(totalPostsResult.rows[0].count, 10);

    
    // Get stats (followers and following count)
    const statsResult = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following`,
      [userId]
    );
    
    // Get the two posts
    const postsResult = await db.query(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.created_at,
              u.username, u.profile_picture_url, u.program
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      user,
      stats: {
        followers: parseInt(statsResult.rows[0].followers),
        following: parseInt(statsResult.rows[0].following)
      },
      posts: postsResult.rows,
      totalPosts: totalPosts,
      hasMore: offset + postsResult.rows.length < totalPosts
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve profile data' 
    });
  }
});

// Add a separate endpoint for loading more posts
router.get('/:username/posts/paginated', async (req, res) => {
  try {
    const db = getDB();
    const username = req.params.username;
    const limit = parseInt(req.query.limit as string) || 5;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get user_id
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Get total post count
    const totalPostsResult = await db.query(
      'SELECT COUNT(*) as total FROM posts WHERE user_id = $1',
      [userId]
    );
    
    // Get posts
    const postsResult = await db.query(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.created_at,
              u.username, u.profile_picture_url, u.program
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const total = parseInt(totalPostsResult.rows[0].total);
    
    
    res.json({
      posts: postsResult.rows,
      totalPosts: total,
      hasMore: offset + postsResult.rows.length < total
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve posts' 
    });
  }
});

export default router;