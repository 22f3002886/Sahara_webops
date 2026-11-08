import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
export function openStore(directory = process.env.DATA_DIR || 'data') {
 const dir=resolve(directory);mkdirSync(dir,{recursive:true,mode:0o700});chmodSync(dir,0o700);
 const path=join(dir,'inquiries.sqlite');const db=new DatabaseSync(path);chmodSync(path,0o600);
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL, message TEXT NOT NULL, fingerprint TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
 db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('secret',randomBytes(32).toString('hex'));
 return {db,path,secret:db.prepare('SELECT value FROM settings WHERE key=?').get('secret').value};
}
