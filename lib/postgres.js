import pg from 'pg';
import { randomBytes } from 'node:crypto';

// All SQL is owned by this application. Values always travel as bound parameters.
export function postgresAdapter(pool) {
  const query = (sql, values) => {
    let index = 0;
    return pool.query(
      sql.replace(/\?/g, () => `$${++index}`),
      values,
    );
  };
  return {
    dialect: 'postgres',
    prepare: (sql) => ({
      get: async (...values) => (await query(sql, values)).rows[0],
      all: async (...values) => (await query(sql, values)).rows,
      run: async (...values) => ({ changes: (await query(sql, values)).rowCount }),
    }),
    close: () => pool.end(),
    async saveInquiry(values) {
      // A single statement commits both rows, including when two requests race.
      const result = await pool.query(
        `WITH inserted AS (
        INSERT INTO inquiries (id,created_at,name,email,topic,message,fingerprint,last_name,identity)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO NOTHING RETURNING id
      ) INSERT INTO email_outbox (inquiry_id) SELECT id FROM inserted RETURNING inquiry_id`,
        values,
      );
      return result.rowCount > 0;
    },
  };
}

export async function initializePostgres(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY, created_at TEXT NOT NULL, name TEXT NOT NULL,
    email TEXT NOT NULL, topic TEXT NOT NULL, message TEXT NOT NULL,
    fingerprint TEXT NOT NULL, last_name TEXT NOT NULL DEFAULT '', identity TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS inquiries_received ON inquiries (created_at DESC, id DESC);
  CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires BIGINT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS email_outbox (
    inquiry_id TEXT PRIMARY KEY REFERENCES inquiries(id), attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt BIGINT NOT NULL DEFAULT 0, sent_at TEXT
  );`);
  await pool.query('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT(key) DO NOTHING', [
    'secret',
    randomBytes(32).toString('hex'),
  ]);
  const result = await pool.query('SELECT value FROM settings WHERE key=$1', ['secret']);
  return { db: postgresAdapter(pool), secret: result.rows[0].value };
}

export async function openPostgres(connectionString = process.env.DATABASE_URL) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw Error('DATABASE_URL must be a PostgreSQL connection URL without surrounding quotes.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw Error('DATABASE_URL must use PostgreSQL.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local && !['require', 'verify-ca', 'verify-full'].includes(url.searchParams.get('sslmode')))
    throw Error('DATABASE_URL must require TLS (sslmode=require).');
  // Verify the server certificate even when the supplied URI says sslmode=require.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'channel_binding'])
    url.searchParams.delete(key);
  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    ssl: local ? false : { rejectUnauthorized: true },
    enableChannelBinding: true,
  });
  pool.on('error', () =>
    console.error('Database connection interrupted; the next request will reconnect.'),
  );
  try {
    return await initializePostgres(pool);
  } catch (error) {
    await pool.end();
    throw error;
  }
}
