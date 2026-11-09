import nodemailer from 'nodemailer';

export const societyInbox = 'connectwithsahara@study.iitm.ac.in';

export function smtpConfiguration(env = process.env) {
  const keys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  if (!keys.some((key) => env[key])) return null;
  if (keys.some((key) => !env[key]))
    throw Error('Set SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM.');
  const port = Number(env.SMTP_PORT || 587);
  if (![465, 587].includes(port)) throw Error('SMTP_PORT must be 465 or 587.');
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.SMTP_FROM))
    throw Error('SMTP_FROM must be a verified sender email address.');
  return {
    from: env.SMTP_FROM,
    options: {
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: true,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      disableFileAccess: true,
      disableUrlAccess: true,
    },
  };
}

export function createEmailDelivery(db, { transport, from, now = Date.now } = {}) {
  const active = new Map();
  let stopping = false;
  async function send(id) {
    const row = db
      .prepare(
        `SELECT i.*, o.attempts, o.sent_at FROM inquiries i
      JOIN email_outbox o ON o.inquiry_id=i.id WHERE i.id=?`,
      )
      .get(id);
    if (!row) return 'unavailable';
    if (row.sent_at) return 'sent';
    if (!transport) return 'queued';
    try {
      const info = await transport.sendMail({
        from: { name: 'SAHARA Website', address: from },
        to: societyInbox,
        replyTo: { name: row.name, address: row.email },
        subject: `[SAHARA · ${row.topic}] ${row.name}`,
        messageId: `<${row.id}@sahara-webops.local>`,
        text: [
          'New SAHARA website inquiry',
          `Name: ${row.name}`,
          `Email: ${row.email}`,
          `Identity: ${row.identity || 'Not specified'}`,
          `Topic: ${row.topic}`,
          `Received: ${row.created_at}`,
          `Reference: ${row.id}`,
          '',
          'Message:',
          row.message,
        ].join('\n'),
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      if (!info.accepted?.some((address) => address.toLowerCase() === societyInbox))
        throw Error('Recipient not accepted');
      db.prepare('UPDATE email_outbox SET sent_at=?, attempts=attempts+1 WHERE inquiry_id=?').run(
        new Date(now()).toISOString(),
        id,
      );
      return 'sent';
    } catch {
      const delay = Math.min(3600000, 30000 * 2 ** Math.min(row.attempts, 7));
      db.prepare(
        'UPDATE email_outbox SET attempts=attempts+1, next_attempt=? WHERE inquiry_id=?',
      ).run(now() + delay, id);
      return 'queued';
    }
  }
  function deliver(id) {
    if (active.has(id)) return active.get(id);
    const promise = send(id).finally(() => active.delete(id));
    active.set(id, promise);
    return promise;
  }
  async function retry() {
    if (!transport) return;
    const pending = db
      .prepare(
        'SELECT inquiry_id FROM email_outbox WHERE sent_at IS NULL AND next_attempt <= ? LIMIT 20',
      )
      .all(now());
    for (const row of pending) {
      if (stopping) break;
      await deliver(row.inquiry_id);
    }
  }
  async function stop() {
    stopping = true;
    await Promise.allSettled([...active.values()]);
  }
  return { deliver, retry, stop, configured: Boolean(transport) };
}

export function configuredEmailDelivery(db, now) {
  const config = smtpConfiguration();
  return createEmailDelivery(db, {
    now,
    ...(config ? { from: config.from, transport: nodemailer.createTransport(config.options) } : {}),
  });
}
