import express from 'express';
import { getDB } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all clubs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    
    const result = await db.query(
      `SELECT c.club_id, c.name, c.description, c.category, c.created_at,
              COUNT(cm.id) as member_count
       FROM clubs c
       LEFT JOIN club_members cm ON c.club_id = cm.club_id
       GROUP BY c.club_id
       ORDER BY c.name ASC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve clubs' 
    });
  }
});

// Get a specific club by ID
router.get('/:clubId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const clubId = req.params.clubId;
    
    const result = await db.query(
      `SELECT c.club_id, c.name, c.description, c.category, c.created_at,
              COUNT(cm.id) as member_count
       FROM clubs c
       LEFT JOIN club_members cm ON c.club_id = cm.club_id
       WHERE c.club_id = $1
       GROUP BY c.club_id`,
      [clubId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve club' 
    });
  }
});

// Create a new club
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { name, description, category } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Club name is required' });
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
    
    // Create club
    const clubResult = await db.query(
      `INSERT INTO clubs (name, description, category)
       VALUES ($1, $2, $3)
       RETURNING club_id, name, description, category, created_at`,
      [name, description || null, category || null]
    );
    
    const clubId = clubResult.rows[0].club_id;
    
    // Automatically make creator an admin
    await db.query(
      `INSERT INTO club_members (club_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [clubId, userId, 'admin']
    );
    
    res.status(201).json({
      success: true,
      club: clubResult.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create club' 
    });
  }
});

// Update a club (admins only)
router.put('/:clubId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const clubId = req.params.clubId;
    const { name, description, category } = req.body;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if user is an admin of this club
    const memberCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );
    
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only club admins can update club info' });
    }
    
    // Update club
    const result = await db.query(
      `UPDATE clubs 
       SET name = $1, description = $2, category = $3
       WHERE club_id = $4
       RETURNING club_id, name, description, category, created_at`,
      [name, description || null, category || null, clubId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    res.json({
      success: true,
      club: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update club' 
    });
  }
});

// Delete a club (admins only)
router.delete('/:clubId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const clubId = req.params.clubId;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if user is an admin of this club
    const memberCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );
    
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only club admins can delete the club' });
    }
    
    // Delete club (CASCADE will delete members too)
    await db.query('DELETE FROM clubs WHERE club_id = $1', [clubId]);
    
    res.json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete club' 
    });
  }
});

// Get all members of a club
router.get('/:clubId/members', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const clubId = req.params.clubId;
    
    const result = await db.query(
      `SELECT cm.id, cm.role, cm.joined_at,
              u.user_id, u.username, u.profile_picture_url
       FROM club_members cm
       JOIN users u ON cm.user_id = u.user_id
       WHERE cm.club_id = $1
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      [clubId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve club members' 
    });
  }
});

// Join a club
router.post('/:clubId/join', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const clubId = req.params.clubId;
    
    // Check if club exists
    const clubCheck = await db.query(
      'SELECT club_id FROM clubs WHERE club_id = $1',
      [clubId]
    );
    
    if (clubCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
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
    
    // Join club (ON CONFLICT prevents duplicate memberships)
    const result = await db.query(
      `INSERT INTO club_members (club_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (club_id, user_id) DO NOTHING
       RETURNING id, club_id, user_id, role, joined_at`,
      [clubId, userId, 'member']
    );
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Already a member of this club'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Joined club successfully',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to join club' 
    });
  }
});

// Leave a club
router.delete('/:clubId/leave', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const clubId = req.params.clubId;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Delete membership
    const result = await db.query(
      'DELETE FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not a member of this club' });
    }
    
    res.json({
      success: true,
      message: 'Left club successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to leave club' 
    });
  }
});

// Get clubs current user is a member of
router.get('/me/memberships', authenticateToken, async (req, res) => {
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
    
    const result = await db.query(
      `SELECT c.club_id, c.name, c.description, c.category, c.created_at,
              cm.role, cm.joined_at,
              COUNT(cm2.id) as member_count
       FROM club_members cm
       JOIN clubs c ON cm.club_id = c.club_id
       LEFT JOIN club_members cm2 ON c.club_id = cm2.club_id
       WHERE cm.user_id = $1
       GROUP BY c.club_id, cm.role, cm.joined_at
       ORDER BY cm.joined_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve club memberships' 
    });
  }
});

// Get clubs by category
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const category = req.params.category;
    
    const result = await db.query(
      `SELECT c.club_id, c.name, c.description, c.category, c.created_at,
              COUNT(cm.id) as member_count
       FROM clubs c
       LEFT JOIN club_members cm ON c.club_id = cm.club_id
       WHERE c.category = $1
       GROUP BY c.club_id
       ORDER BY c.name ASC`,
      [category]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve clubs by category' 
    });
  }
});

export default router;