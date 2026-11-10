import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { initializePostgres } from '../lib/postgres.js';
import { createApp } from '../lib/app.js';

function pool(engine) {
  return {
    async query(sql, values) {
      if (!values && sql.includes('CREATE TABLE')) {
        await engine.exec(sql);
        return { rows: [], rowCount: 0 };
      }
      const result = await engine.query(sql, values);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    },
    end: () => engine.close(),
  };
}

test('PostgreSQL: validated contact + atomic outbox, duplicate requests, CLI-shaped retrieval and durable reopen', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sahara-postgres-'));
  let store;
  let server;
  try {
    store = await initializePostgres(pool(new PGlite(directory)));
    const secret = store.secret;
    let now = Date.now();
    const created = createApp({
      store,
      now: () => now,
      admin: { password: 'synthetic-postgres-admin-password' },
    });
    server = created.app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const { token } = await (await fetch(`${base}/api/form-token`)).json();
    now += 1600;
    const body = {
      token,
      id: randomUUID(),
      website: '',
      name: 'Postgres Tester',
      lastName: 'Example',
      identity: 'Student',
      email: 'pg-test@example.com',
      topic: 'Collaboration',
      message: 'Synthetic durable Postgres inquiry.',
    };
    const send = (data) =>
      fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    assert.equal((await send(body)).status, 201);
    assert.equal((await send(body)).status, 200);
    assert.equal((await send({ ...body, message: 'Different synthetic message.' })).status, 409);
    assert.equal((await store.db.prepare('SELECT COUNT(*) AS n FROM inquiries').get()).n, 1);
    assert.equal((await store.db.prepare('SELECT COUNT(*) AS n FROM email_outbox').get()).n, 1);
    assert.equal(await created.emailDelivery.deliver(body.id), 'queued');
    const login = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'synthetic-postgres-admin-password' }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const inbox = await fetch(`${base}/api/admin/inquiries?q=pg-test`, {
      headers: { Cookie: cookie },
    });
    assert.equal(inbox.status, 200);
    const found = await inbox.json();
    assert.equal(found.storage, 'PostgreSQL');
    assert.equal(found.total, 1);
    assert.equal(found.items[0].message, body.message);
    await new Promise((resolve) => server.close(resolve));
    server = null;
    await store.db.close();
    store = null;
    store = await initializePostgres(pool(new PGlite(directory)));
    assert.equal(store.secret, secret);
    const row = await store.db.prepare('SELECT * FROM inquiries WHERE id=?').get(body.id);
    assert.equal(row.name, 'Postgres Tester Example');
    assert.equal(row.identity, 'Student');
    assert.equal(row.message, body.message);
    await assert.rejects(
      store.db.saveInquiry([randomUUID(), new Date().toISOString(), 'Missing required field']),
      /bind|parameter/i,
    );
    assert.equal((await store.db.prepare('SELECT COUNT(*) AS n FROM inquiries').get()).n, 1);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (store) await store.db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
