// types/search.ts
export interface UserSearchResult {
  username: string;
  profile_picture_url: string | null;
  program: string | null;
  bio: string | null;
}

export interface EventSearchResult {
  id: number;
  content: string;
  club_name: string;
  event_date: string;
  department: string | null;
  image_url: string;
}

export interface SearchResults {
  users: UserSearchResult[];
  events: EventSearchResult[];
}