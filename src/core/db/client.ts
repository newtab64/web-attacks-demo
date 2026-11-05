import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

let vulnDbInstance: Database.Database | null = null;
let secureDbInstance: Database.Database | null = null;

function createConnection(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function getDb(mode?: 'vulnerable' | 'secure'): Database.Database {
  const targetMode = mode ?? env.securityMode;

  if (targetMode === 'vulnerable') {
    if (!vulnDbInstance) {
      const dbPath = path.resolve('data/vulnerable.db');
      vulnDbInstance = createConnection(dbPath);
    }
    return vulnDbInstance;
  }

  if (!secureDbInstance) {
    const dbPath = path.resolve('data/secure.db');
    secureDbInstance = createConnection(dbPath);
  }
  return secureDbInstance;
}

export function closeDatabases(): void {
  if (vulnDbInstance) {
    vulnDbInstance.close();
    vulnDbInstance = null;
  }
  if (secureDbInstance) {
    secureDbInstance.close();
    secureDbInstance = null;
  }
}
