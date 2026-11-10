# Private inquiry workflow

Requires Node.js 22.13+ (Node 22 currently prints an experimental SQLite warning).

Run `npm ci` once, then `npm start`. Open http://localhost:3000. The same process serves the page and `/api/contact`.

Accepted inquiries and email jobs are committed together to PostgreSQL when `DATABASE_URL` is set, or private `data/inquiries.sqlite` otherwise. Neon data survives Render app sleep/restart/redeploy; local SQLite on Render Free does not. Existing SQLite records are not imported automatically. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup and the private `/admin` inbox. With SMTP configured, the topic/sender and all submitted details go to `connectwithsahara@study.iitm.ac.in`. Without it, inquiries still save and appear in the dashboard; email remains queued.

On the server, as an authorized operator:

```sh
npm run inquiries -- 50
```

This prints private JSON. Without `DATABASE_URL`, the CLI opens local SQLite read-only; with it, the command initializes/opens the PostgreSQL schema and retrieves records. Match the app's storage configuration. A local command without the hosted URL cannot retrieve hosted messages. Do not paste output into GitHub or logs. Web retrieval is available only through authenticated `/api/admin` endpoints.

Configuration uses environment variables; `.env.example` is a safe template. To load a local `.env` explicitly, use `node --env-file=.env server.js`. Never commit `.env`.

Production requires PostgreSQL or a persistent disk for SQLite, `NODE_ENV=production`, exact HTTPS `PUBLIC_ORIGIN`, and a build before startup. Set `HOST=0.0.0.0` behind the host's HTTPS proxy. When Render's platform variable `RENDER=true` is present, Express trusts one proxy hop for client IP/protocol; other hosts require reviewing their proxy topology. Contact attempts are limited to five per IP per 15 minutes. Do not enable proxy trust on an untrusted direct connection.

## Admin access

Set a unique `ADMIN_PASSWORD` of 16–256 characters in hosting secrets and optional `ADMIN_USERNAME` (default `admin`). Open `/admin` over HTTPS. The backend derives the password verifier with scrypt; credentials never appear in browser code. Missing configuration disables access. Eight-hour sessions are stored as token hashes in the selected database; logout revokes them and changing credentials invalidates them. Login has persistent rate limits, and cookies are HttpOnly/SameSite=Strict/Secure in production. All admin pages/APIs send no-store/noindex headers. Queries use bound parameters and messages are rendered as text. See [DEPLOYMENT.md](DEPLOYMENT.md) for the acceptance test.

The PostgreSQL pool has at most three connections and verifies TLS certificates. Schema setup is additive/idempotent. The signing secret and rate buckets persist in PostgreSQL, so ordinary redeploys do not invalidate form tokens. Keep `DATABASE_URL` private. Backups and retention are separate operator tasks.

Keep the entire data directory private, including SQLite WAL/SHM files. Directory mode is 0700 and database mode is 0600. Keep database backups outside the public assets/repository using SQLite's backup tools; avoid copying a live database without its WAL. Operators should establish retention and deletion policies before collecting real inquiries.

## Enable official inbox delivery

Set `SMTP_HOST`, `SMTP_PORT` (587 for STARTTLS or 465 for TLS), `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` using `.env.example`. `SMTP_FROM` must be an address your provider authorizes. Obtain these from the society's email administrator or an authorized SMTP provider. Do not use a normal account password when the provider requires an App Password or SMTP credential. Never paste credentials into chat, source code, or GitHub.

Run `node --env-file=.env server.js` locally, or set the variables in your hosting secrets and restart the process. The recipient is fixed in server code to the society inbox. SMTP credentials are never sent to the browser. Partial configuration fails startup. Absent configuration keeps inquiries queued, while the public interface confirms only that the inquiry was received and saved.

Failed SMTP attempts remain in a durable outbox and retry every 30 seconds with increasing delays (up to one hour), including after a restart. Existing records from before email support are not automatically mailed. Once a provider accepts the recipient, the job is marked sent and ordinary repeat submissions with the same request ID do not send again. As with SMTP generally, a crash after provider acceptance but before recording it can cause a duplicate; the stable Message-ID aids investigation. Provider acceptance does not prove inbox placement; check the official inbox/spam folder during activation.

For private delivery status, inspect `email_outbox` with an authorized client for the configured database. Tests use synthetic transports; live email still requires provider credentials and an inbox check. Render Free blocks SMTP ports 25/465/587; use another delivery approach/host if email is later required. The current dashboard workflow does not require SMTP.
