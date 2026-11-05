import { getDb } from '../db/client.js';
import type { Database } from 'better-sqlite3';
import type { PostRow, TagRow, CommentRow, RecentCommentRow } from '../types/index.js';
import { formatRelativeTimeVi } from '../utils/time.js';

export class PostsService {
  private db: Database;

  constructor(mode: 'vulnerable' | 'secure') {
    this.db = getDb(mode);
  }

  public getAllPosts(page = 1, limit = 10): { posts: PostRow[]; total: number } {
    const offset = (page - 1) * limit;
    const totalRow = this.db.prepare('SELECT COUNT(*) as count FROM posts').get() as {
      count: number;
    };
    const posts = this.db
      .prepare(
        `SELECT p.*, u.username as author_name,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as PostRow[];

    for (const post of posts) {
      post.tags = this.getTagsForPost(post.id);
    }

    return { posts, total: totalRow.count };
  }

  public getPostsByTag(tagSlug: string, page = 1, limit = 10): PostRow[] {
    const offset = (page - 1) * limit;
    // Parameterized in both modes to ensure tag filter does not introduce SQL injection
    const posts = this.db
      .prepare(
        `SELECT p.*, u.username as author_name,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        JOIN post_tags pt ON p.id = pt.post_id
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.slug = ?
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?`,
      )
      .all(tagSlug, limit, offset) as PostRow[];

    for (const post of posts) {
      post.tags = this.getTagsForPost(post.id);
    }

    return posts;
  }

  public getPostById(id: number): (PostRow & { comments: CommentRow[] }) | null {
    const post = this.db
      .prepare(
        `SELECT p.*, u.username as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?`,
      )
      .get(id) as PostRow | undefined;

    if (!post) return null;

    post.tags = this.getTagsForPost(post.id);
    const comments = this.db
      .prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC')
      .all(post.id) as CommentRow[];

    for (const comment of comments) {
      comment.relative_time = formatRelativeTimeVi(comment.created_at);
    }

    return { ...post, comments };
  }

  public getTagsForPost(postId: number): TagRow[] {
    return this.db
      .prepare(
        `SELECT t.* FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?`,
      )
      .all(postId) as TagRow[];
  }

  public getAllTags(): TagRow[] {
    return this.db.prepare('SELECT * FROM tags ORDER BY id ASC').all() as TagRow[];
  }

  public getRecentComments(limit = 5): RecentCommentRow[] {
    const comments = this.db
      .prepare(
        `SELECT c.id, c.post_id, c.author_name, c.created_at, p.title as post_title
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        ORDER BY c.id DESC
        LIMIT ?`,
      )
      .all(limit) as RecentCommentRow[];

    for (const comment of comments) {
      comment.relative_time = formatRelativeTimeVi(comment.created_at);
    }

    return comments;
  }
}
