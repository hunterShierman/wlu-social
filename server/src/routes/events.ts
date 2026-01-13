import express from 'express';
import { getDB } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all events
router.get('/all', async (req, res) => {
  try {
    const db = getDB();
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const result = await db.query(
      `SELECT e.id, e.club_name, e.content, e.image_url, e.department, e.event_date, e.location, e.created_at
       FROM events e
       ORDER BY e.event_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve events' 
    });
  }
});

// Get events by department
router.get('/department/:department', async (req, res) => {
  try {
    const db = getDB();
    const department = req.params.department;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const result = await db.query(
      `SELECT e.id, e.user_id, e.content, e.image_url, e.department, e.event_date, e.location, e.created_at,
              u.username, u.profile_picture_url, u.program
       FROM events e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.department = $1
       ORDER BY e.event_date DESC
       LIMIT $2`,
      [department, limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve events' 
    });
  }
});

// Create new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { content, image_url, department, event_date, location } = req.body;
    
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
      `INSERT INTO events (user_id, content, image_url, department, event_date, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, content, image_url, department, event_date, location, created_at`,
      [userId, content, image_url || null, department || 'General', event_date || null, location || null]
    );
    
    res.status(201).json({
      success: true,
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create event' 
    });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const eventId = req.params.id;
    const { content, image_url, department, event_date, location } = req.body;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if event exists and belongs to user
    const eventCheck = await db.query(
      'SELECT user_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (eventCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }
    
    const result = await db.query(
      `UPDATE events 
       SET content = $1, image_url = $2, department = $3, event_date = $4, location = $5
       WHERE id = $6
       RETURNING id, user_id, content, image_url, department, event_date, location, created_at`,
      [content, image_url || null, department, event_date || null, location || null, eventId]
    );
    
    res.json({
      success: true,
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update event' 
    });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const eventId = req.params.id;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if event exists and belongs to user
    const eventCheck = await db.query(
      'SELECT user_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (eventCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    await db.query('DELETE FROM events WHERE id = $1', [eventId]);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete event' 
    });
  }
});

// Get events by user
router.get('/user/:username', async (req, res) => {
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
    
    const result = await db.query(
      `SELECT e.id, e.user_id, e.content, e.image_url, e.department, e.event_date, e.location, e.created_at,
              u.username, u.profile_picture_url, u.program
       FROM events e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.user_id = $1
       ORDER BY e.event_date DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user events' 
    });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const eventId = req.params.id;
    
    const result = await db.query(
      `SELECT e.id, e.club_name, e.content, e.image_url, e.department, e.event_date, e.location, e.created_at
       FROM events e
       WHERE e.id = $1`,
      [eventId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve event' 
    });
  }
});

// Register for an event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const eventId = req.params.id;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if event exists
    const eventCheck = await db.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Insert registration (UNIQUE constraint prevents duplicates)
    const result = await db.query(
      `INSERT INTO event_registrations (event_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (event_id, user_id) DO NOTHING
       RETURNING id, event_id, user_id, registered_at`,
      [eventId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Already registered for this event' 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register for event' 
    });
  }
});

// Unregister from an event
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const eventId = req.params.id;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Delete registration
    const result = await db.query(
      'DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING id',
      [eventId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unregister from event' 
    });
  }
});

// Check if current user is registered for an event
router.get('/:id/register/status', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const eventId = req.params.id;
    
    // Get user_id from username
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [req.user?.username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Check if registered
    const result = await db.query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    
    res.json({
      isRegistered: result.rows.length > 0
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check registration status' 
    });
  }
});

export default router;