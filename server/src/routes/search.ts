// server/routes/search.ts
import express from 'express';
import { getDB } from '../config/database.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json({ users: [], events: [] });
  }

  const searchTerm = `%${q}%`;

  try {
    // Search users
    const db = getDB();
    const usersQuery = `
      SELECT username, profile_picture_url, program, bio
      FROM users
      WHERE username ILIKE $1
         OR program ILIKE $1
         OR bio ILIKE $1
      LIMIT 5
    `;
    const usersResult = await db.query(usersQuery, [searchTerm]);

    // Search events
    const eventsQuery = `
      SELECT id, content, club_name, event_date, department, image_url
      FROM events
      WHERE content ILIKE $1
         OR club_name ILIKE $1
         OR department ILIKE $1
      LIMIT 5
    `;
    const eventsResult = await db.query(eventsQuery, [searchTerm]);

    res.json({
      users: usersResult.rows,
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;