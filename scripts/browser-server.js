import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
// This fixed directory is exclusively synthetic browser-test data.
const directory = resolve('artifacts/browser-data');
rmSync(directory, { recursive: true, force: true });
process.env.DATA_DIR = directory;
process.env.PORT = '3100';
// Never let a developer's cloud database or mail configuration reach browser tests.
for (const key of [
  'DATABASE_URL',
  'PUBLIC_ORIGIN',
  'RENDER',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'ADMIN_USERNAME',
])
  delete process.env[key];
// This password exists only in the isolated synthetic test server.
process.env.ADMIN_PASSWORD = 'synthetic-browser-password-only';
await import('../server.js');
