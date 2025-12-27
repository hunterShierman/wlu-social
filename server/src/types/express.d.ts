import { JwtPayload } from "jsonwebtoken";


// src/types/express.d.ts
export interface UserPayload {
  username: string;
  iat?: number;  // issued at (auto-added by jwt.sign)
  exp?: number;  // expires at (auto-added by jwt.sign)
}

export interface user {
  username: string 
  password: string 
}

  declare global {
    namespace Express {
      interface Request {
        user?: UserPayload;
      }
    }
  }
