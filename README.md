# WLU Connect

A modern social networking platform designed specifically for Wilfrid Laurier University students to connect, share updates, and collaborate academically.


 Check it out here: https://wlu-social.vercel.app

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment & Hosting](#deployment-hosting)

## 🎯 Overview

WLU Connect is a university-focused social media platform that enables students to:
- Share posts and updates with the campus community
- Discover and register for club events
- Form and join course-specific study groups
- Build their academic network through following other students

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure access and refresh tokens
- **Protected routes** ensuring only authenticated users can post, comment, and interact
- **Password hashing** using bcrypt for secure credential storage

### 👤 User Profiles
- **Customizable profiles** with bio, program of study, and profile pictures
- **Image upload and cropping** with Cloudinary integration
- **Follow/unfollow system** to build your campus network
- **User statistics** displaying follower count, following count, and total posts
- **Pagination** for efficient loading of user posts

### 📝 Posts & Interactions
- **Rich post creation** with text content and image attachments
- **Post categorization** with 6 types: General, Career, Academic, Question, Opportunity, Achievement
- **Like system** with real-time count updates
- **Commenting system** with nested replies and pagination
- **Post deletion** for content ownership
- **Character limits** to maintain post quality (500 characters)
- **Image preview** before posting

### 📅 Club Events
- **Event discovery** with search and faculty filtering
- **Event registration** with capacity management
- **Event details** including date, time, location, and club organizer
- **Registration tracking** showing current capacity and member list

### 📚 Study Groups
- **Course-based organization** using course codes
- **Flexible scheduling** supporting both one-time sessions and recurring meetings
- **Location tracking** for physical or virtual meeting spaces
- **Member capacity limits** to maintain effective group sizes
- **Join/leave functionality** with instant updates
- **Search and filter** by course code, group name, or creator
- **Group tabs** to view all available groups or just your memberships

## 🛠 Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0.1-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?logo=tailwind-css&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)

### Cloud Services
![Cloudinary](https://img.shields.io/badge/Cloudinary-3488C6?logo=cloudinary&logoColor=white)

### Additional Libraries

**Frontend**
- `react-easy-crop`: Professional image cropping for profile pictures
- `date-fns` / Native Date: Date formatting and manipulation

**Backend**
- `jsonwebtoken`: JWT token generation and verification
- `bcrypt`: Password hashing and comparison
- `pg`: PostgreSQL client for Node.js
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management
- `express-rate-limit`: API rate limiting for security

### Database Schema

**Key Tables:**
- `users`: User accounts and profiles
- `posts`: User-generated content
- `comments`: Post comments and replies
- `likes`: Post like tracking
- `follows`: User follow relationships
- `events`: Club events and activities
- `event_registrations`: Event attendance tracking
- `study_groups`: Academic study groups
- `study_group_members`: Study group memberships

### Authentication Flow
```
User Login → Backend validates credentials → JWT issued
            ↓
JWT stored in localStorage
            ↓
All API requests include JWT in Authorization header
            ↓
Backend middleware validates JWT → Route handler executes
```

### Image Upload Flow
```
User selects image → Image cropped in browser
                    ↓
                Cropped file sent to backend
                    ↓
                Backend receives file
                    ↓
                Upload to Cloudinary
                    ↓
                Cloudinary URL returned
                    ↓
                URL saved in PostgreSQL
                    ↓
                Frontend displays image from Cloudinary CDN
```

## 📁 Project Structure
```
wlu-connect/
├── client/                   # Frontend React application
│   ├── src/
│   │   ├── assets/          # Static assets (images, icons)
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Comment.tsx
│   │   │   ├── CreatePost.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── NavBar.tsx
│   │   │   └── Post.tsx
│   │   ├── context/         # React Context providers
│   │   │   └── AuthContext.tsx
│   │   ├── modals/          # Modal components
│   │   │   ├── CreateGroupModal.tsx
│   │   │   └── GroupMembersModal.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── EditProfile.tsx
│   │   │   ├── EventInfo.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── FollowList.tsx
│   │   │   ├── GroupStudy.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── ResendVerification.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── VerifyEmail.tsx
│   │   ├── types/           # TypeScript type definitions
│   │   │   ├── comment.ts
│   │   │   ├── event.ts
│   │   │   ├── post.ts
│   │   │   ├── profile.ts
│   │   │   ├── search.ts
│   │   │   └── user.ts
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   ├── index.css        # Global styles
│   │   ├── main.tsx         # Entry point
│   │   └── svg.d.ts         # SVG type declarations
│   ├── public/              # Static assets
│   ├── .env.development     # Development environment variables
│   ├── index.html           # HTML template
│   └── package.json
│
├── server/                  # Backend Express application
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   ├── cloudinary.ts
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.ts
│   │   │   └── rateLimit.ts
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── clubs.ts
│   │   │   ├── comments.ts
│   │   │   ├── events.ts
│   │   │   ├── likes.ts
│   │   │   ├── posts.ts
│   │   │   ├── search.ts
│   │   │   ├── studyGroups.ts
│   │   │   ├── upload.ts
│   │   │   └── users.ts
│   │   ├── types/           # TypeScript type definitions
│   │   │   └── express.d.ts
│   │   ├── utils/           # Utility functions
│   │   │   └── email.ts
│   │   └── index.ts         # Server entry point
│   ├── requests/            # API request examples/tests
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 📡 API Documentation

### Authentication Endpoints
```
POST   /auth/signup          Create new user account
POST   /auth/login           Authenticate user
POST   /auth/refresh         Refresh access token
```

### User Endpoints
```
GET    /users/me/profile                Get current user profile
GET    /users/:username                 Get user by username
GET    /users/:username/complete        Get complete profile data
PUT    /users/:username                 Update user profile
POST   /users/:username/follow          Follow a user
DELETE /users/:username/follow          Unfollow a user
GET    /users/:username/follow/status   Check follow status
```

### Post Endpoints
```
GET    /posts/all                       Get all posts (paginated)
GET    /posts/:id                       Get single post
POST   /posts                           Create new post
DELETE /posts/:id                       Delete post
GET    /posts/:id/comments              Get post comments
POST   /posts/:id/comments              Add comment
```

### Like Endpoints
```
POST   /likes/posts/:id/like            Like a post
DELETE /likes/posts/:id/like            Unlike a post
GET    /likes/posts/:id/me              Check if user liked post
GET    /likes/posts/:id/count           Get like count
```

### Event Endpoints
```
GET    /events/all                      Get all events
GET    /events/:id                      Get event details
POST   /events/:id/register             Register for event
DELETE /events/:id/register             Unregister from event
GET    /events/:id/register/status      Check registration status
```

### Study Group Endpoints
```
GET    /study-groups                    Get all study groups
GET    /study-groups/:id                Get group details
POST   /study-groups                    Create study group
POST   /study-groups/:id/join           Join study group
DELETE /study-groups/:id/leave          Leave study group
GET    /study-groups/me/memberships     Get user's groups
```

### Upload Endpoints
```
POST   /upload/image                    Upload image to Cloudinary
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Rate Limiting**: Prevents abuse of upload and authentication endpoints
- **CORS Configuration**: Restricts cross-origin requests
- **Input Validation**: Prevents SQL injection and XSS attacks
- **File Type Validation**: Only allows image uploads (JPEG, PNG, GIF, WebP)
- **File Size Limits**: 5MB maximum for uploads
- **Protected Routes**: Middleware ensures authentication for sensitive operations

## 🚀 Deployment

### Frontend (Vercel)
The React frontend is deployed on **Vercel** with automatic deployments from the main branch. Vercel handles the build process (`npm run build`) and serves the static assets through their global CDN.

**Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables configured for API URL pointing to the Railway backend

### Backend & Database (Railway)
The Express server and PostgreSQL database are both hosted on **Railway**, providing a unified backend infrastructure.

**Setup:**
- Node.js server deployed from the `/server` directory
- PostgreSQL database provisioned through Railway's managed database service
- Environment variables configured for database connection, JWT secrets, and Cloudinary credentials
- Automatic deployments triggered on push to main branch

---

## Disclaimer

This project is an independent portfolio demonstration created by Hunter Shierman. 
It is not affiliated with, endorsed by, or associated with Wilfrid Laurier 
University. Any reference to "WLU" or "Wilfrid Laurier University" is for 
descriptive purposes only to indicate the target audience and inspiration 
for the platform.





