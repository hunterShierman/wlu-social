export interface Post {
    id: number;
    user_id: number;
    username: string;
    content: string;
    image_url: string | null;
    post_type: string;
    created_at: string;
    profile_picture_url?: string;
  } 