import express from 'express';
import { connectDB, getDB } from './config/database';
import { config } from './config/env';
import cors from 'cors';
import postsRouter from './routes/posts';
import usersRouter from './routes/users';
import commentsRouter from './routes/comments';
import likesRouter from './routes/likes';
import clubsRouter from './routes/clubs';
import studyGroupsRouter from './routes/studyGroups';
import eventRoutes from './routes/events';


const app = express();

// Middleware
app.use(express.json());

// allow the frontend to make requests to the backend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Mount routes
app.use('/posts', postsRouter);
app.use('/users', usersRouter);
app.use('/', commentsRouter);
app.use('/likes', likesRouter);
app.use('/clubs', clubsRouter);
app.use('/study-groups', studyGroupsRouter);
app.use('/events', eventRoutes);


// Connect to database and start server
const startServer = async () => {
  await connectDB();
  
  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  });
};

startServer();