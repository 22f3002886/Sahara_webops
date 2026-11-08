import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createApp } from '../lib/app.js';
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sahara-test-'));
  let clock = Date.now();
  const { app, db } = createApp({ directory, now: () => clock });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    await rm(directory, { recursive: true, force: true });
  });
  return {
    db,
    directory,
    base,
    advance: (ms = 1600) => {
      clock += ms;
    },
    send: (data, extra = {}) =>
      fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...extra },
        body: JSON.stringify(data),
      }),
    token: async () => {
      const r = await fetch(`${base}/api/form-token`);
      return (await r.json()).token;
    },
  };
}
function payload(token) {
  return {
    id: randomUUID(),
    token,
    website: '',
    name: '  Synthetic Tester  ',
    email: 'TEST@example.com',
    topic: 'Volunteering',
    message: 'Synthetic test inquiry for verification.',
  };
}
test('durable save, normalization, idempotency, private CLI retrieval, restart', async (t) => {
  const f = await fixture(t);
  const body = payload(await f.token());
  f.advance();
  assert.equal((await f.send(body)).status, 201);
  assert.equal((await f.send(body)).status, 200);
  assert.equal(f.db.prepare('SELECT COUNT(*) as n FROM inquiries').get().n, 1);
  assert.equal(
    (await f.send({ ...body, message: 'Changed synthetic inquiry content' })).status,
    409,
  );
  const rows = JSON.parse(
    execFileSync(process.execPath, ['scripts/inquiries.js', '10'], {
      env: { ...process.env, DATA_DIR: f.directory },
      encoding: 'utf8',
    }),
  );
  assert.equal(rows[0].name, 'Synthetic Tester');
  assert.equal(rows[0].email, 'test@example.com');
  const reopened = createApp({ directory: f.directory });
  assert.equal(reopened.db.prepare('SELECT id FROM inquiries').get().id, body.id);
  reopened.db.close();
  assert.equal((await stat(join(f.directory, 'inquiries.sqlite'))).mode & 0o777, 0o600);
  assert.equal((await fetch(`${f.base}/data/inquiries.sqlite`)).status, 404);
  assert.equal((await fetch(`${f.base}/api/inquiries`)).status, 404);
});
test('field validation and parameterized storage', async (t) => {
  const f = await fixture(t);
  const token = await f.token();
  f.advance();
  const invalid = await f.send({
    ...payload(token),
    name: 'x',
    email: 'bad',
    topic: 'Invalid',
    message: 'short',
  });
  assert.equal(invalid.status, 422);
  assert.equal(Object.keys((await invalid.json()).errors).length, 4);
  assert.equal(
    (await f.send({ ...payload(token), name: 'A'.repeat(81), message: 'a'.repeat(5001) })).status,
    422,
  );
  const input = { ...payload(token), name: "Robert'); DROP TABLE inquiries;--" };
  assert.equal((await f.send(input)).status, 201);
  assert.equal(f.db.prepare('SELECT name FROM inquiries').get().name, input.name);
});
test('honeypot, signed token, minimum time, expiry, wrong origin', async (t) => {
  const f = await fixture(t);
  const body = payload(await f.token());
  assert.equal((await f.send(body)).status, 400);
  f.advance();
  assert.equal((await f.send({ ...body, website: 'spam.example' })).status, 400);
  assert.equal((await f.send({ ...body, token: body.token + 'x' })).status, 400);
  assert.equal((await f.send(body, { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await f.send({ ...body, token: `1.x.${'0'.repeat(64)}` })).status, 400);
  assert.equal(f.db.prepare('SELECT count(*) as n FROM inquiries').get().n, 0);
});
test('expired tokens are rejected', async (t) => {
  const f = await fixture(t);
  const body = payload(await f.token());
  f.advance(7200001);
  assert.equal((await f.send(body)).status, 400);
  assert.equal(f.db.prepare('SELECT count(*) as n FROM inquiries').get().n, 0);
});
test('request size, content type, malformed JSON and rate limit', async (t) => {
  const f = await fixture(t);
  const url = `${f.base}/api/contact`;
  assert.equal(
    (
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'x'.repeat(13000),
      })
    ).status,
    413,
  );
  assert.equal(
    (
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      })
    ).status,
    400,
  );
  assert.equal((await fetch(url, { method: 'POST', body: 'plain text' })).status, 415);
  await f.send({});
  await f.send({});
  const rate = await f.send({});
  assert.equal(rate.status, 429);
  assert.ok(rate.headers.get('retry-after'));
});
test('database failure returns failure and never claims acceptance', async (t) => {
  const f = await fixture(t);
  const data = payload(await f.token());
  f.advance();
  f.db.exec(
    "CREATE TRIGGER reject_write BEFORE INSERT ON inquiries BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;",
  );
  const response = await f.send(data);
  assert.equal(response.status, 500);
  assert.equal((await response.json()).ok, undefined);
});

test('noncanonical API paths cannot bypass rate buckets', async (t) => {
  const f = await fixture(t);
  for (const path of ['/api/contact/', '/api/Contact', '/API/contact']) {
    const response = await fetch(f.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 404);
  }
});
