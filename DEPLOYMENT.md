# Render + Neon + private admin inbox

Keep the existing Render Web Service and public URL. Do not create a Static Site.

## Render settings

Repository: `22f3002886/Sahara_webops`; branch: `main`; root directory: empty.

- Build: `npm ci && npm run build`
- Start: `npm start`
- Compute: Free is adequate for the assignment demo; cold starts still occur.

Set these in the service's **Environment**, not in GitHub or browser JavaScript:

| Key              | Value                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `NODE_VERSION`   | `22`                                                                                                          |
| `NODE_ENV`       | `production`                                                                                                  |
| `HOST`           | `0.0.0.0`                                                                                                     |
| `PUBLIC_ORIGIN`  | `https://sahara-webops.onrender.com`                                                                          |
| `DATABASE_URL`   | Entire Neon pooled `postgresql://...` URL, including SSL parameters, without quotes or `DATABASE_URL_POOLED=` |
| `ADMIN_USERNAME` | `admin`, or your chosen username                                                                              |
| `ADMIN_PASSWORD` | A unique password you choose, 16–256 characters                                                               |

Do not use documentation examples as the password. Keep the real password and URL in your password manager/Render secrets. No society email password is required. Render supplies `PORT` and `RENDER`; do not set them manually. Leave SMTP variables unset for this storage-and-dashboard workflow.

Choose **Save, rebuild, and deploy**. With automatic deploy enabled, pushes to `main` also trigger deployment. Otherwise select **Manual Deploy → Deploy latest commit**. Wait for **Live**. Logs should show `Storage: PostgreSQL` and the server listening. An SMTP-not-configured notice is expected. If initialization fails, check the URL/password, Neon project's availability and `sslmode=require`; the app never silently switches to SQLite. Never share credentials in logs/screenshots.

## Live acceptance

1. Refresh the website after deployment, fill one clearly synthetic contact inquiry and submit.
2. The success message confirms database acceptance; email delivery remains unconfigured and is not disclosed in the public interface.
3. Open **https://sahara-webops.onrender.com/admin**.
4. Sign in with the username/password above. Find the synthetic inquiry and choose **Read message**. Verify all details.
5. Check Search, Refresh and Sign out. In a private browser window, the inbox must require login.
6. Redeploy and confirm the same inquiry remains. The Neon Console table viewer also lets the authorized account owner inspect `inquiries`.
7. Only after this succeeds, select **My app is connected** in Neon onboarding. That button does not connect or migrate the app by itself.

Give the evaluator the admin URL and share dashboard credentials privately. Never publish the password with the public website/GitHub link.

## Storage and security

With Neon configured, inquiries, outbox, signing secret, rate buckets and hashed admin sessions live in PostgreSQL. Render sleep/restart/redeploy no longer removes those rows. Render Free can still take about a minute to wake up. Neon usage/account limits and database deletion are separate concerns; persistent storage is not a backup.

Old SQLite submissions are not imported automatically. Preserve any still-accessible needed records before switching; creating Neon cannot restore already lost files. The dashboard shows records from the currently configured database.

Login uses scrypt password verification and constant-time comparison. Sessions last eight hours, use HttpOnly/SameSite=Strict cookies (Secure in production), and are stored as hashes. Changing the password or username invalidates existing sessions. Logout revokes the session and requires an origin/CSRF check. Five sign-in attempts per IP per 15 minutes are allowed, including successful attempts. Missing `ADMIN_PASSWORD` disables admin APIs. The inbox is read-only, with no public registration, password recovery, deletion or role management.

## Verification boundary

Tests run PostgreSQL SQL through a local PGlite PostgreSQL engine and browser workflows through isolated SQLite storage. They cover form-to-inbox retrieval, password checks, denied anonymous access, search/pagination, duplicate requests, durable reopen, session expiry/revocation and safe text rendering. This does not claim a live Neon connection or hosted dashboard login until the operator completes the acceptance steps with private Render configuration. SMTP inbox delivery is not required for this workflow.
