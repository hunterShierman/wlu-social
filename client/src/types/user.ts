export interface User {
    user_id: number;
    username: string;
    email: string;
    bio: string | null;
    profile_picture_url: string | null;
    created_at: string;
  }