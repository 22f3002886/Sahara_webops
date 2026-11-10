import express from 'express';
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const derive = promisify(scrypt);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const cookieName = 'sahara_admin';
const lifetime = 8 * 60 * 60 * 1000;

export function mountAdmin(
  app,
  {
    db,
    secret,
    now = Date.now,
    password = process.env.ADMIN_PASSWORD,
    username = process.env.ADMIN_USERNAME || 'admin',
  },
) {
  if (password && (password.length < 16 || password.length > 256))
    throw Error('ADMIN_PASSWORD must be 16–256 characters.');
  const salt = createHmac('sha256', secret).update('admin-password').digest();
  const passwordHash = password ? scryptSync(password, salt, 64) : null;
  const credential = passwordHash ? digest(`${username}:${passwordHash.toString('hex')}`) : '';
  const secure = process.env.NODE_ENV === 'production';
  const cookieOptions = { httpOnly: true, secure, sameSite: 'strict', path: '/api/admin' };
  app.use(['/admin', '/api/admin'], (_req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    });
    next();
  });
  app.get(['/admin', '/admin/'], (_req, res) =>
    res.sendFile(
      resolve(
        process.env.NODE_ENV === 'production' ? 'dist/admin/index.html' : 'public/admin/index.html',
      ),
    ),
  );
  const router = express.Router({ caseSensitive: true, strict: true });
  router.use((_req, res, next) =>
    passwordHash
      ? next()
      : res.status(503).json({
          error: 'Admin access is not configured. Set ADMIN_PASSWORD in the server environment.',
        }),
  );
  function sameOrigin(req, res, next) {
    const expected = process.env.PUBLIC_ORIGIN
      ? new URL(process.env.PUBLIC_ORIGIN).origin
      : `${req.protocol}://${req.get('host')}`;
    if (req.get('origin') !== expected || req.get('sec-fetch-site') === 'cross-site')
      return res.status(403).json({ error: 'Please sign in from this website.' });
    if (!req.is('application/json'))
      return res.status(415).json({ error: 'Please send a JSON request.' });
    next();
  }
  async function auth(req, res, next) {
    const token = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      return res.status(401).json({ error: 'Please sign in to view submissions.' });
    const session = await db
      .prepare('SELECT * FROM admin_sessions WHERE token_hash=?')
      .get(digest(token));
    if (!session || Number(session.expires) <= now() || session.credential !== credential)
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    req.adminSession = session;
    next();
  }
  router.post(
    '/login',
    sameOrigin,
    async (req, res, next) => {
      const time = now();
      await db.prepare('DELETE FROM limits WHERE expires < ?').run(time);
      const key = createHmac('sha256', secret).update(`admin-login:${req.ip}`).digest('hex');
      const result = await db
        .prepare(
          'INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=limits.hits+1 RETURNING hits,expires',
        )
        .get(key, time + 15 * 60 * 1000);
      if (result.hits > 5) {
        res.set(
          'Retry-After',
          String(Math.max(1, Math.ceil((Number(result.expires) - time) / 1000))),
        );
        return res
          .status(429)
          .json({ error: 'Too many sign-in attempts. Please try again in 15 minutes.' });
      }
      next();
    },
    express.json({ limit: '2kb', strict: true }),
    async (req, res) => {
      const value =
        typeof req.body?.password === 'string' && req.body.password.length <= 256
          ? req.body.password
          : '';
      const supplied = await derive(value, salt, 64);
      if (!timingSafeEqual(supplied, passwordHash) || req.body?.username !== username)
        return res.status(401).json({ error: 'Incorrect username or password.' });
      const token = randomBytes(32).toString('hex');
      const csrf = randomBytes(32).toString('hex');
      await db.prepare('DELETE FROM admin_sessions WHERE expires <= ?').run(now());
      await db
        .prepare('INSERT INTO admin_sessions (token_hash,csrf,expires,credential) VALUES (?,?,?,?)')
        .run(digest(token), csrf, now() + lifetime, credential);
      res.cookie(cookieName, token, { ...cookieOptions, maxAge: lifetime });
      res.json({ ok: true, csrf, username });
    },
  );
  router.get('/session', auth, (req, res) =>
    res.json({ ok: true, csrf: req.adminSession.csrf, username }),
  );
  router.post(
    '/logout',
    sameOrigin,
    auth,
    (req, res, next) => {
      if (req.get('x-csrf-token') !== req.adminSession.csrf)
        return res.status(403).json({ error: 'Refresh this page before signing out.' });
      next();
    },
    async (req, res) => {
      await db
        .prepare('DELETE FROM admin_sessions WHERE token_hash=?')
        .run(req.adminSession.token_hash);
      res.clearCookie(cookieName, cookieOptions);
      res.json({ ok: true });
    },
  );
  router.get('/inquiries', auth, async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const offset = Number(req.query.offset || 0);
    if (q.length > 100 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
      return res.status(400).json({ error: 'Invalid search or page.' });
    // Literal substring matching avoids wildcard injection and works on both databases.
    const values = q ? [`%${q.replace(/[!%_]/g, '!$&').toLowerCase()}%`] : [];
    const where = q
      ? " WHERE LOWER(name || ' ' || email || ' ' || topic || ' ' || message) LIKE ? ESCAPE '!'"
      : '';
    const rows = await db
      .prepare(
        `SELECT id,created_at,name,email,topic,message,last_name,identity FROM inquiries${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`,
      )
      .all(...values, 21, offset);
    const count = await db
      .prepare(`SELECT COUNT(*) AS total FROM inquiries${where}`)
      .get(...values);
    res.json({
      items: rows.slice(0, 20),
      total: Number(count.total),
      nextOffset: rows.length > 20 ? offset + 20 : null,
      storage: db.dialect === 'postgres' ? 'PostgreSQL' : 'SQLite',
    });
  });
  router.use((_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  app.use('/api/admin', router);
}
