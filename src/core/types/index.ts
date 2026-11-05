export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'member';
}

export interface FlashMessages {
  error?: string;
  success?: string;
}

export interface UserRow {
  id: number;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface PostRow {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: number;
  created_at: string;
  read_time: string;
  author_name?: string;
  comments_count?: number;
  tags?: TagRow[];
}

export interface TagRow {
  id: number;
  name: string;
  slug: string;
}

export interface CommentRow {
  id: number;
  post_id: number;
  author_name: string;
  content: string;
  created_at: string;
  relative_time?: string;
}

export interface RecentCommentRow {
  id: number;
  post_id: number;
  author_name: string;
  created_at: string;
  post_title: string;
  relative_time?: string;
}
