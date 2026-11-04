import { getDb } from '../../db/client.js';
import type { Database } from 'better-sqlite3';
import type { PostRow, TagRow } from '../../types/index.js';

export class SearchService {
  private db: Database;
  private mode: 'vulnerable' | 'secure';

  constructor(mode: 'vulnerable' | 'secure') {
    this.mode = mode;
    this.db = getDb(mode);
  }

  public searchTitles(query: string): PostRow[] {
    if (this.mode === 'vulnerable') {
      // vulnerable: string concatenation allows SQL injection to bypass LIKE filter
      const querySql = `SELECT p.*, u.username as author_name,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.title LIKE '%${query}%'
      ORDER BY p.id DESC`;

      const posts = this.db.prepare(querySql).all() as PostRow[];
      for (const post of posts) {
        post.tags = this.getTagsForPost(post.id);
      }
      return posts;
    }

    // secure: parameterized query treats user input strictly as a literal search value
    const querySql = `SELECT p.*, u.username as author_name,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.title LIKE ?
    ORDER BY p.id DESC`;

    const posts = this.db.prepare(querySql).all(`%${query}%`) as PostRow[];
    for (const post of posts) {
      post.tags = this.getTagsForPost(post.id);
    }
    return posts;
  }

  private getTagsForPost(postId: number): TagRow[] {
    return this.db
      .prepare(
        `SELECT t.* FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?`,
      )
      .all(postId) as TagRow[];
  }
}
