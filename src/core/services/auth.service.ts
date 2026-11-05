import bcrypt from 'bcryptjs';
import { getDb } from '../db/client.js';
import type { Database } from 'better-sqlite3';
import type { UserRow, SessionUser } from '../types/index.js';

export class AuthService {
  private db: Database;
  private mode: 'vulnerable' | 'secure';

  constructor(mode: 'vulnerable' | 'secure') {
    this.mode = mode;
    this.db = getDb(mode);
  }

  public login(username: string, password: string): SessionUser | null {
    if (this.mode === 'vulnerable') {
      // vulnerable: string interpolation permits SQL injection authentication bypass
      const query = `SELECT id, username, password, email, role FROM users WHERE username = '${username}' AND password = '${password}'`;
      const user = this.db.prepare(query).get() as UserRow | undefined;
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    }

    // secure: parameterized query prevents SQL injection; bcrypt verifies hashed password
    const user = this.db
      .prepare('SELECT id, username, password, email, role FROM users WHERE username = ?')
      .get(username) as UserRow | undefined;

    if (!user) return null;
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  public register(username: string, password: string, email: string): SessionUser {
    if (this.mode === 'vulnerable') {
      // vulnerable: store plaintext password without hashing
      const result = this.db
        .prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)')
        .run(username, password, email, 'member');
      return {
        id: Number(result.lastInsertRowid),
        username,
        email,
        role: 'member',
      };
    }

    // secure: hash password with bcryptjs before persisting
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = this.db
      .prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)')
      .run(username, hashedPassword, email, 'member');

    return {
      id: Number(result.lastInsertRowid),
      username,
      email,
      role: 'member',
    };
  }

  public getUserByUsername(username: string): UserRow | null {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
      | UserRow
      | undefined;
    return user ?? null;
  }

  public getUserById(id: number): SessionUser | null {
    const user = this.db
      .prepare('SELECT id, username, email, role FROM users WHERE id = ?')
      .get(id) as SessionUser | undefined;
    return user ?? null;
  }
}
