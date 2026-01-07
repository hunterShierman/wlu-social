export interface Event {
    id: number;
    user_id: number;
    content: string;
    image_url: string | null;
    department: string;
    event_date: string | null;
    location: string | null;
    created_at: string;
    username: string;
    profile_picture_url: string | null;
    program: string | null;
  }