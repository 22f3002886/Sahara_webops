# Private inquiry workflow

Requires Node.js 22.13+ (Node 22 currently prints an experimental SQLite warning).

Run `npm ci` once, then `npm start`. Open http://localhost:3000. The same process serves the page and `/api/contact`.

Accepted inquiries and email jobs are committed together to `data/inquiries.sqlite` using SQLite WAL and FULL synchronization. Each new inquiry is immediately emailed to `connectwithsahara@study.iitm.ac.in` when SMTP is configured. The subject includes the topic and sender name; the body contains name, email, identity, topic, message, timestamp, and reference. Reply-To points to the visitor, while From uses your verified sending address.

On the server, as an authorized operator:

```sh
npm run inquiries -- 50
```

This reads the latest 50 inquiries as JSON, including optional last-name and identity context. Existing databases are migrated additively at startup; no inquiries are deleted. Output is private; do not paste it into GitHub, logs, or public tools. The CLI opens SQLite read-only. No web endpoint exposes inquiries. Stop and restart `npm start` to confirm records persist, then retrieve them again. `DATA_DIR` must match between the server and CLI.

Configuration uses environment variables; `.env.example` is a safe template. To load a local `.env` explicitly, use `node --env-file=.env server.js`. Never commit `.env`.

Production requires a Node host with a persistent disk, a private absolute `DATA_DIR`, `NODE_ENV=production`, the exact `PUBLIC_ORIGIN` (HTTPS, no trailing slash), and `npm run build` before startup. Set `HOST=0.0.0.0` only behind your host's HTTPS proxy. The app does not trust arbitrary forwarded IP headers; configure a trusted proxy explicitly if needed before enabling per-visitor rate limits behind a proxy. Default limits are five contact attempts per connection IP per 15 minutes, with signed, expiring form tokens and a honeypot. A proxy may cause visitors to share the same rate bucket.

Keep the entire data directory private, including SQLite WAL/SHM files. Directory mode is 0700 and database mode is 0600. Keep database backups outside the public assets/repository using SQLite's backup tools; avoid copying a live database without its WAL. Operators should establish retention and deletion policies before collecting real inquiries.

## Enable official inbox delivery

Set `SMTP_HOST`, `SMTP_PORT` (587 for STARTTLS or 465 for TLS), `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` using `.env.example`. `SMTP_FROM` must be an address your provider authorizes. Obtain these from the society's email administrator or an authorized SMTP provider. Do not use a normal account password when the provider requires an App Password or SMTP credential. Never paste credentials into chat, source code, or GitHub.

Run `node --env-file=.env server.js` locally, or set the variables in your hosting secrets and restart the process. The recipient is fixed in server code to the society inbox. SMTP credentials are never sent to the browser. Partial configuration fails startup. Absent configuration keeps inquiries queued, and the browser explicitly says email delivery is pending.

Failed SMTP attempts remain in a durable outbox and retry every 30 seconds with increasing delays (up to one hour), including after a restart. Existing records from before email support are not automatically mailed. Once a provider accepts the recipient, the job is marked sent and ordinary repeat submissions with the same request ID do not send again. As with SMTP generally, a crash after provider acceptance but before recording it can cause a duplicate; the stable Message-ID aids investigation. Provider acceptance does not prove inbox placement; check the official inbox/spam folder during activation.

For private delivery status, inspect `email_outbox` alongside the inquiry using an authorized SQLite client. Automated tests use synthetic transports and verify content, recipient, retries, and persistence. Live official-inbox delivery still requires credentials and confirmation from an inbox operator.
