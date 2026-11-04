import { getDb } from '../../db/client.js';
import type { Database } from 'better-sqlite3';
import type { SessionUser } from '../../types/index.js';

export class ProfileService {
  private db: Database;

  constructor(mode: 'vulnerable' | 'secure') {
    this.db = getDb(mode);
  }

  public getUserById(id: number): SessionUser | null {
    const user = this.db
      .prepare('SELECT id, username, email, role FROM users WHERE id = ?')
      .get(id) as SessionUser | undefined;
    return user ?? null;
  }

  public updateEmail(id: number, email: string): boolean {
    const result = this.db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id);
    return result.changes > 0;
  }
}
