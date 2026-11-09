import express from 'express';
import helmet from 'helmet';
import { createHmac, timingSafeEqual, randomUUID, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { openStore } from './storage.js';
import { configuredEmailDelivery } from './email.js';
const topics = new Set([
  'Volunteering',
  'Join Core Team',
  'Event Suggestion',
  'Collaboration',
  'Sponsorship',
  'Social Activity Participation',
  'Feedback',
  'Other',
]);
const identities = new Set([
  'Individual',
  'Student',
  'Professional',
  'Influencer',
  'Organization',
  'Social Activist',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createApp({
  directory,
  now = Date.now,
  emailFactory = configuredEmailDelivery,
} = {}) {
  const { db, secret } = openStore(directory);
  const emailDelivery = emailFactory(db, now);
  const app = express();
  app.disable('x-powered-by');
  app.enable('case sensitive routing');
  app.enable('strict routing');
  app.use(helmet({ referrerPolicy: { policy: 'strict-origin-when-cross-origin' } }));
  const sign = (value) => createHmac('sha256', secret).update(value).digest('hex');
  function limit(req, res, next) {
    const time = now();
    db.prepare('DELETE FROM limits WHERE expires < ?').run(time);
    const key = sign(`${req.ip}:${req.path}`);
    const result = db
      .prepare(
        'INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits,expires',
      )
      .get(key, time + 15 * 60 * 1000);
    if (result.hits > (req.path === '/api/contact' ? 5 : 30)) {
      res.set('Retry-After', String(Math.ceil((result.expires - time) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please try again in 15 minutes.' });
    }
    next();
  }
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/form-token', limit, (_req, res) => {
    const value = `${now()}.${randomUUID()}`;
    res.json({ token: `${value}.${sign(value)}` });
  });
  app.post(
    '/api/contact',
    limit,
    (req, res, next) => {
      const origin = req.get('origin');
      const expected = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get('host')}`;
      if ((origin && origin !== expected) || req.get('sec-fetch-site') === 'cross-site')
        return res.status(403).json({ error: 'Please submit the form from this website.' });
      if (!req.is('application/json'))
        return res.status(415).json({ error: 'Please send a JSON request.' });
      next();
    },
    express.json({ limit: '12kb', strict: true }),
    async (req, res) => {
      const body = req.body;
      if (!body || Array.isArray(body))
        return res.status(400).json({ error: 'Invalid form data.' });
      if (typeof body.website !== 'string' || body.website !== '')
        return res.status(400).json({ error: 'Unable to accept this submission.' });
      const token = typeof body.token === 'string' ? body.token : '';
      const parts = token.split('.');
      const value = parts.slice(0, 2).join('.');
      const signature = parts[2] || '';
      if (
        parts.length !== 3 ||
        !/^[0-9a-f]{64}$/.test(signature) ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(value))) ||
        !Number.isFinite(Number(parts[0])) ||
        now() - Number(parts[0]) < 1500 ||
        now() - Number(parts[0]) > 7200000
      )
        return res.status(400).json({
          error:
            'Please wait a moment and try again. If this page has been open for two hours, reload it.',
        });
      const errors = {};
      const clean = {};
      for (const field of ['name', 'lastName', 'identity', 'email', 'topic', 'message'])
        clean[field] = typeof body[field] === 'string' ? body[field].normalize('NFKC').trim() : '';
      clean.name = clean.name.replace(/\s+/g, ' ');
      clean.lastName = clean.lastName.replace(/\s+/g, ' ');
      clean.email = clean.email.toLowerCase();
      clean.message = clean.message.replace(/\r\n?/g, '\n');
      // Reject control characters in names and messages; multiline message whitespace is allowed.
      // eslint-disable-next-line no-control-regex
      const nameControls = /[\x00-\x1f\x7f]/;
      // eslint-disable-next-line no-control-regex
      const messageControls = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;
      if (clean.name.length < 2 || clean.name.length > 80 || nameControls.test(clean.name))
        errors.name = 'Use 2–80 characters for your name.';
      if (
        clean.lastName.length > 80 ||
        nameControls.test(clean.lastName) ||
        (body.lastName !== undefined && typeof body.lastName !== 'string')
      )
        errors.lastName = 'Use at most 80 characters for your last name.';
      if (
        (clean.identity && !identities.has(clean.identity)) ||
        (body.identity !== undefined && typeof body.identity !== 'string')
      )
        errors.identity = 'Choose one of the listed identities.';
      if (clean.email.length > 254 || !/^\S+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(clean.email))
        errors.email = 'Enter a valid email address.';
      if (!topics.has(clean.topic)) errors.topic = 'Select an inquiry topic.';
      if (
        clean.message.length < 10 ||
        clean.message.length > 5000 ||
        messageControls.test(clean.message)
      )
        errors.message = 'Use 10–5,000 characters for your message.';
      if (Object.keys(errors).length)
        return res.status(422).json({ error: 'Please check the highlighted fields.', errors });
      if (typeof body.id !== 'string' || !uuid.test(body.id))
        return res.status(400).json({ error: 'Invalid request identifier. Reload and try again.' });
      const fingerprint = createHash('sha256').update(JSON.stringify(clean)).digest('hex');
      const existing = db.prepare('SELECT fingerprint FROM inquiries WHERE id=?').get(body.id);
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          return res
            .status(409)
            .json({ error: 'This request changed. Reload the page before submitting again.' });
        const delivery = await emailDelivery.deliver(body.id);
        return res.json({ ok: true, id: body.id, delivery });
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          'INSERT INTO inquiries (id,created_at,name,email,topic,message,fingerprint,last_name,identity) VALUES (?,?,?,?,?,?,?,?,?)',
        ).run(
          body.id,
          new Date(now()).toISOString(),
          [clean.name, clean.lastName].filter(Boolean).join(' '),
          clean.email,
          clean.topic,
          clean.message,
          fingerprint,
          clean.lastName,
          clean.identity,
        );
        db.prepare('INSERT INTO email_outbox (inquiry_id) VALUES (?)').run(body.id);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      const delivery = await emailDelivery.deliver(body.id);
      return res.status(201).json({ ok: true, id: body.id, delivery });
    },
  );
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  app.use(
    express.static(resolve(process.env.NODE_ENV === 'production' ? 'dist' : 'public'), {
      dotfiles: 'deny',
      index: 'index.html',
    }),
  );
  app.use((_req, res) => res.status(404).type('text').send('Page not found.'));
  app.use((error, _req, res, _next) => {
    const status =
      error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    if (status === 500) console.error('Contact handler failed:', error.code || error.name);
    res.status(status).json({
      error:
        status === 413
          ? 'Your request is too large.'
          : status === 400
            ? 'Invalid JSON request.'
            : 'We could not save your message. Please try again later.',
    });
  });
  return { app, db, emailDelivery };
}
