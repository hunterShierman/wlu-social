import express from 'express';
import { connectDB, getDB } from './config/database';
import { config } from './config/env';
import cors from 'cors';
import postsRouter from './routes/posts';
import usersRouter from './routes/users';
import commentsRouter from './routes/comments';
import likesRouter from './routes/likes';
import clubsRouter from './routes/clubs';


const app = express();

// Middleware
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:1000', // Your React app URL
  credentials: true
}));

// Mount routes
app.use('/posts', postsRouter);
app.use('/users', usersRouter);
app.use('/', commentsRouter);
app.use('/', likesRouter);
app.use('/clubs', clubsRouter);


// Connect to database and start server
const startServer = async () => {
  await connectDB();
  
  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  });
};

startServer();