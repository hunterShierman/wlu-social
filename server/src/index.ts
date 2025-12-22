import express from 'express';
import { connectDB } from './config/database';
import { config } from './config/env';

const app = express();

// Middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Test database route
app.get('/api/test-db', async (req, res) => {
  try {
    const { getDB } = await import('./config/database');
    const db = getDB();
    const result = await db.query('SELECT * FROM clubs');
    res.json({ 
      success: true, 
      timestamp: result.rows[0].now,
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed' 
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