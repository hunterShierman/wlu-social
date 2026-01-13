import express from 'express';
import { connectDB, getDB } from './config/database.js';
import { config } from './config/env.js';
import cors from 'cors';
import postsRouter from './routes/posts.js';
import usersRouter from './routes/users.js';
import commentsRouter from './routes/comments.js';
import likesRouter from './routes/likes.js';
import clubsRouter from './routes/clubs.js';
import studyGroupsRouter from './routes/studyGroups.js';
import eventRoutes from './routes/events.js';
import uploadRoutes from './routes/upload.js';
import authRouter, { cleanupExpiredTokens } from './routes/auth.js';

const app = express();

// Middleware
app.use(express.json());

// allow the frontend to make requests to the backend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Mount routes
app.use('/auth', authRouter);
app.use('/posts', postsRouter);
app.use('/users', usersRouter);
app.use('/', commentsRouter);
app.use('/likes', likesRouter);
app.use('/clubs', clubsRouter);
app.use('/study-groups', studyGroupsRouter);
app.use('/events', eventRoutes);
app.use('/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


// Connect to database and start server
const startServer = async () => {
  await connectDB();

  // Clean up expired tokens on startup
  await cleanupExpiredTokens();

  // Set up periodic cleanup: every hour
  setInterval(async () => {
    await cleanupExpiredTokens();
  }, 60 * 60 * 1000); // 1 hour
  
  const PORT = parseInt(process.env.PORT || '8080', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();