// Run only on the server as an authorized operator. Output contains private data.
import { DatabaseSync } from 'node:sqlite';
import { resolve, join } from 'node:path';
import { openPostgres } from '../lib/postgres.js';
const db = process.env.DATABASE_URL
  ? (await openPostgres()).db
  : new DatabaseSync(join(resolve(process.env.DATA_DIR || 'data'), 'inquiries.sqlite'), {
      readOnly: true,
    });
const limit = Number(process.argv[2] || 50);
if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
  throw Error('Usage: npm run inquiries -- [1–1000]');
const rows = await db
  .prepare(
    'SELECT id,created_at,name,email,topic,message,last_name,identity FROM inquiries ORDER BY created_at DESC LIMIT ?',
  )
  .all(limit);
console.log(JSON.stringify(rows, null, 2));
await db.close();
