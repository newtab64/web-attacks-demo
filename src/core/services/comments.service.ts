import { getDb } from '../db/client.js';
import type { Database } from 'better-sqlite3';
import type { CommentRow } from '../types/index.js';
import { formatRelativeTimeVi } from '../utils/time.js';

export class CommentsService {
  private db: Database;

  constructor(mode: 'vulnerable' | 'secure') {
    this.db = getDb(mode);
  }

  public createComment(postId: number, authorName: string, content: string): CommentRow {
    // Both modes store the comment content in the database.
    // The vulnerability contrast is in how content is rendered in templates (<%- vs <%=) and CSP.
    const result = this.db
      .prepare(
        "INSERT INTO comments (post_id, author_name, content, created_at) VALUES (?, ?, ?, datetime('now'))",
      )
      .run(postId, authorName, content);

    const id = Number(result.lastInsertRowid);
    const comment = this.db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as CommentRow;
    comment.relative_time = formatRelativeTimeVi(comment.created_at);
    return comment;
  }

  public getCommentsForPost(postId: number): CommentRow[] {
    const comments = this.db
      .prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC')
      .all(postId) as CommentRow[];

    for (const comment of comments) {
      comment.relative_time = formatRelativeTimeVi(comment.created_at);
    }

    return comments;
  }
}
