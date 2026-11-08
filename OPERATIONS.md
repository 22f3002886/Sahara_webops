# Private inquiry workflow

Requires Node.js 22.13+ (Node 22 currently prints an experimental SQLite warning).

Run `npm ci` once, then `npm start`. Open http://localhost:3000. The same process serves the page and `/api/contact`.

Accepted inquiries are committed to `data/inquiries.sqlite` using SQLite WAL and FULL synchronization. Nothing is emailed. The browser confirms acceptance only after a successful database write (or a previously recorded identical request).

On the server, as an authorized operator:

```sh
npm run inquiries -- 50
```

This reads the latest 50 inquiries as JSON, including optional last-name and identity context. Existing databases are migrated additively at startup; no inquiries are deleted. Output is private; do not paste it into GitHub, logs, or public tools. The CLI opens SQLite read-only. No web endpoint exposes inquiries. Stop and restart `npm start` to confirm records persist, then retrieve them again. `DATA_DIR` must match between the server and CLI.

Configuration uses environment variables; `.env.example` is a safe template. To load a local `.env` explicitly, use `node --env-file=.env server.js`. Never commit `.env`.

Production requires a Node host with a persistent disk, a private absolute `DATA_DIR`, `NODE_ENV=production`, the exact `PUBLIC_ORIGIN` (HTTPS, no trailing slash), and `npm run build` before startup. Set `HOST=0.0.0.0` only behind your host's HTTPS proxy. The app does not trust arbitrary forwarded IP headers; configure a trusted proxy explicitly if needed before enabling per-visitor rate limits behind a proxy. Default limits are five contact attempts per connection IP per 15 minutes, with signed, expiring form tokens and a honeypot. A proxy may cause visitors to share the same rate bucket.

Keep the entire data directory private, including SQLite WAL/SHM files. Directory mode is 0700 and database mode is 0600. Keep database backups outside the public assets/repository using SQLite's backup tools; avoid copying a live database without its WAL. Operators should establish retention and deletion policies before collecting real inquiries.

Inbox notifications are not configured or verified. To add them, an operator must supply a mail provider, a verified sending domain/address, an authorized recipient inbox, and server-only credentials. Implement queued delivery with retries after database acceptance, then verify with that inbox. Never claim email delivery merely because a record was saved.
