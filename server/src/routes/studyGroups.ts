import express from 'express';
import { getDB } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all study groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    
    const result = await db.query(
      `SELECT sg.group_id, sg.name, sg.course_code, sg.description, sg.max_members, sg.created_at,
              u.username as created_by_username,
              COUNT(sgm.id) as current_members
       FROM study_groups sg
       JOIN users u ON sg.created_by = u.user_id
       LEFT JOIN study_group_members sgm ON sg.group_id = sgm.group_id
       GROUP BY sg.group_id, u.username
       ORDER BY sg.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve study groups' 
    });
  }
});

// Create a study group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { name, course_code, description, max_members } = req.body;
    
    if (!name || !course_code) {
      return res.status(400).json({ error: 'Name and course code are required' });
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
    
    // Create study group
    const groupResult = await db.query(
      `INSERT INTO study_groups (name, course_code, description, max_members, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING group_id, name, course_code, description, max_members, created_by, created_at`,
      [name, course_code, description || null, max_members || null, userId]
    );
    
    const groupId = groupResult.rows[0].group_id;
    
    // Automatically add creator as member
    await db.query(
      `INSERT INTO study_group_members (group_id, user_id)
       VALUES ($1, $2)`,
      [groupId, userId]
    );
    
    res.status(201).json({
      success: true,
      group: groupResult.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create study group' 
    });
  }
});

// Join a study group
router.post('/:groupId/join', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const groupId = req.params.groupId;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if group exists and get max_members
    const groupCheck = await db.query(
      'SELECT max_members FROM study_groups WHERE group_id = $1',
      [groupId]
    );
    
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found' });
    }
    
    const maxMembers = groupCheck.rows[0].max_members;
    
    // Check current member count if there's a limit
    if (maxMembers) {
      const memberCount = await db.query(
        'SELECT COUNT(*) as count FROM study_group_members WHERE group_id = $1',
        [groupId]
      );
      
      if (parseInt(memberCount.rows[0].count) >= maxMembers) {
        return res.status(400).json({ error: 'Study group is full' });
      }
    }
    
    // Join group
    const result = await db.query(
      `INSERT INTO study_group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, user_id) DO NOTHING
       RETURNING id, group_id, user_id, joined_at`,
      [groupId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Already a member of this study group'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Joined study group successfully',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to join study group' 
    });
  }
});

// Leave a study group
router.delete('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const groupId = req.params.groupId;
    
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
      'DELETE FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not a member of this study group' });
    }
    
    res.json({
      success: true,
      message: 'Left study group successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to leave study group' 
    });
  }
});

// Get study groups by course code
router.get('/course/:courseCode', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const courseCode = req.params.courseCode;
    
    const result = await db.query(
      `SELECT sg.group_id, sg.name, sg.course_code, sg.description, sg.max_members, sg.created_at,
              u.username as created_by_username,
              COUNT(sgm.id) as current_members
       FROM study_groups sg
       JOIN users u ON sg.created_by = u.user_id
       LEFT JOIN study_group_members sgm ON sg.group_id = sgm.group_id
       WHERE sg.course_code = $1
       GROUP BY sg.group_id, u.username
       ORDER BY sg.created_at DESC`,
      [courseCode]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve study groups' 
    });
  }
});

// Get study groups current user is a member of
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
      `SELECT sg.group_id, sg.name, sg.course_code, sg.description, sg.max_members, sg.created_at,
              sgm.joined_at,
              u.username as created_by_username,
              COUNT(sgm2.id) as current_members
       FROM study_group_members sgm
       JOIN study_groups sg ON sgm.group_id = sg.group_id
       JOIN users u ON sg.created_by = u.user_id
       LEFT JOIN study_group_members sgm2 ON sg.group_id = sgm2.group_id
       WHERE sgm.user_id = $1
       GROUP BY sg.group_id, sgm.joined_at, u.username
       ORDER BY sgm.joined_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve study group memberships' 
    });
  }
});

export default router;