import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../lib/app.js';

const password = 'synthetic-test-password-only';
async function fixture(t, admin = { password }) {
  const directory = await mkdtemp(join(tmpdir(), 'sahara-admin-test-'));
  let now = Date.now();
  const { app, db } = createApp({ directory, admin, now: () => now });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const send = (path, body, headers = {}) =>
    fetch(`${base}/api/admin${path}`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    await rm(directory, { recursive: true, force: true });
  });
  return {
    base,
    db,
    send,
    directory,
    advance: (ms) => {
      now += ms;
    },
  };
}
test('admin denies anonymous access and is disabled without configuration', async (t) => {
  const f = await fixture(t, { password: undefined });
  assert.equal((await fetch(`${f.base}/api/admin/inquiries`)).status, 503);
  assert.equal((await f.send('/login', { username: 'admin', password })).status, 503);
});
test('admin password, cookie, protected search/pagination, literal text, CSRF and logout', async (t) => {
  const f = await fixture(t);
  assert.equal((await fetch(`${f.base}/api/admin/inquiries`)).status, 401);
  assert.equal(
    (await f.send('/login', { username: 'admin', password }, { Origin: 'https://evil.example' }))
      .status,
    403,
  );
  assert.equal((await f.send('/login', { username: 'admin', password: 'wrong' })).status, 401);
  const response = await f.send('/login', { username: 'admin', password });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  const cookie = setCookie.split(';')[0];
  const { csrf } = await response.json();
  const hash = f.db.prepare('SELECT token_hash FROM admin_sessions').get().token_hash;
  assert.notEqual(hash, cookie.split('=')[1]);
  for (let i = 0; i < 25; i++)
    f.db.saveInquiry([
      `synthetic-${i}`,
      new Date(Date.now() + i).toISOString(),
      `Synthetic ${i}`,
      'test@example.com',
      'Feedback',
      i === 24 ? '<script>alert(1)</script> 100% synthetic' : 'Synthetic test message',
      'fingerprint',
      '',
      'Student',
    ]);
  const get = (path) => fetch(`${f.base}/api/admin${path}`, { headers: { Cookie: cookie } });
  const inbox = await get('/inquiries');
  assert.match(inbox.headers.get('cache-control'), /no-store/);
  const first = await inbox.json();
  assert.equal(first.items.length, 20);
  assert.equal(first.total, 25);
  assert.equal(first.nextOffset, 20);
  assert.equal(first.items[0].id, 'synthetic-24');
  const second = await (await get('/inquiries?offset=20')).json();
  assert.equal(second.items.length, 5);
  assert.equal(second.nextOffset, null);
  const search = await (await get('/inquiries?q=100%25')).json();
  assert.equal(search.total, 1);
  assert.match(search.items[0].message, /<script>/);
  assert.equal((await (await get('/inquiries?q=%27%20OR%201%3D1--')).json()).total, 0);
  assert.equal((await get('/inquiries?offset=-1')).status, 400);
  assert.equal((await f.send('/logout', {}, { Cookie: cookie })).status, 403);
  assert.equal((await f.send('/logout', {}, { Cookie: cookie, 'X-CSRF-Token': csrf })).status, 200);
  assert.equal((await get('/inquiries')).status, 401);
});
test('admin login attempts are limited, sessions expire and survive app restart only with the same credential', async (t) => {
  const f = await fixture(t);
  const response = await f.send('/login', { username: 'admin', password });
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const restarted = createApp({ directory: f.directory, admin: { password } });
  const rotated = createApp({
    directory: f.directory,
    admin: { password: 'different-synthetic-password' },
  });
  async function check(app) {
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    try {
      return (
        await fetch(`http://127.0.0.1:${server.address().port}/api/admin/session`, {
          headers: { Cookie: cookie },
        })
      ).status;
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }
  try {
    assert.equal(await check(restarted.app), 200);
    assert.equal(await check(rotated.app), 401);
  } finally {
    restarted.db.close();
    rotated.db.close();
  }
  for (let i = 0; i < 4; i++)
    assert.equal((await f.send('/login', { username: 'admin', password: 'wrong' })).status, 401);
  assert.equal((await f.send('/login', { username: 'admin', password })).status, 429);
  f.advance(8 * 60 * 60 * 1000 + 1);
  assert.equal(
    (await fetch(`${f.base}/api/admin/session`, { headers: { Cookie: cookie } })).status,
    401,
  );
});
