// src/types/express.d.ts
export interface userPayLoad {
    username: string
  }
  
  declare global {
    namespace Express {
      interface Request {
        user?: JwtPayload;
      }
    }
  }

  export interface user {
    username?: string 
    password?: string 
  }