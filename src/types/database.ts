export type AppRole = "host" | "guest" | "admin";
export type PostType = "cultural_dish" | "recipe" | "travel_memory" | "experience_memory";
export type ExperienceType = "meal" | "cooking_class" | "festival";
export type BookingStatus = "requested" | "approved" | "rejected";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  languages: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  post_type: PostType;
  region: string | null;
  cuisine: string | null;
  experience_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Experience {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  story: string | null;
  cuisine_type: string | null;
  location: string | null;
  max_guests: number;
  price_per_person: number | null;
  image_url: string | null;
  experience_type: ExperienceType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  host?: Profile;
}

export interface Booking {
  id: string;
  experience_id: string;
  guest_id: string;
  host_id: string;
  status: BookingStatus;
  guests_count: number;
  message: string | null;
  booking_date: string | null;
  created_at: string;
  updated_at: string;
  experience?: Experience;
  guest?: Profile;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  image_url: string | null;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
  host?: Profile;
  rsvp_count?: number;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  experience_id: string | null;
  rating: number;
  content: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: Profile[];
  last_message?: Message;
}
