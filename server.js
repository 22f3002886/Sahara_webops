import { createApp } from './lib/app.js';
import { openPostgres } from './lib/postgres.js';
let store;
try {
  if (process.env.DATABASE_URL) store = await openPostgres();
} catch (error) {
  console.error(
    'Database initialization failed. Check DATABASE_URL and database availability.',
    error.code || error.name,
  );
  process.exit(1);
}
const { app, db, emailDelivery } = createApp({ store });
console.log(`Storage: ${store ? 'PostgreSQL' : 'local SQLite'}`);
if (!emailDelivery.configured)
  console.warn('SMTP is not configured; inquiry emails remain queued.');
const emailTimer = setInterval(
  () => emailDelivery.retry().catch(() => console.error('Email retry failed.')),
  30000,
);
emailTimer.unref();
emailDelivery.retry().catch(() => console.error('Email retry failed.'));
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, process.env.HOST || '127.0.0.1', () =>
  console.log(`SAHARA: http://localhost:${port}`),
);
function shutdown() {
  clearInterval(emailTimer);
  server.close(async () => {
    await emailDelivery.stop();
    await db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
