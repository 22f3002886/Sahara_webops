# SAHARA · Small acts. Shared humanity.

An original, responsive landing page for **SAHARA — The Social Welfare Society of the IIT Madras BS Degree community**, built for the WebOps recruitment assignment. Public source: https://github.com/22f3002886/Sahara_webops

## Run locally

Requires **Node.js 22.13+** and npm. Tested on Node 22.14.0. Node 22 emits an experimental warning for its built-in SQLite module; no separate database installation is needed.

```sh
npm ci
npm start
```

Open **http://localhost:3000**. One startup command serves the page and real contact API. `npm run dev` enables server reloads.

## What is included

| Section             | Implementation                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Hero                | Authentic official-site volunteering photo, new local logo, working in-page actions                                   |
| About               | IIT Madras BS affiliation, mission, vision, approach, qualitative impact presentation                                 |
| Team                | Two current roles verified in the 2026 brief, plus six explicitly historical profiles                                 |
| Events & activities | Three sourced past activities/sessions, dates, locations, official archive links                                      |
| Gallery             | Three official archive images, captions, modal preview, next/previous, arrow keys, Escape, focus trap and restoration |
| Contact             | Published society email, accessible validation, pending and failure states, durable SQLite save                       |
| Footer              | New logo, section navigation, affiliation, assignment credit, official Instagram/LinkedIn/YouTube links               |

The visual system pairs amber and burnt orange from the supplied logo with warm paper, deep green, serif headlines, and generous spacing. System fonts avoid third-party font requests. Semantic HTML, CSS, and vanilla JavaScript keep the page small; Express provides a single origin for both assets and contact requests. Images are local WebP derivatives; the supplied JPEG logo is preserved without distortion. There are no fabricated metrics, testimonials, current appointments, or scheduled events.

## Contact and private operator retrieval

```sh
npm run inquiries -- 50
```

This server-local, read-only command prints the latest 50 inquiries as private JSON. **Do not publish its output.** Records survive a process restart. Full configuration, data handling, backup, proxy, and notification guidance is in [OPERATIONS.md](OPERATIONS.md).

The form normalizes and validates fields server-side, limits payloads to 12 KB, uses parameterized SQL, signed tokens with a minimum age and two-hour expiry, a honeypot, persistent rate buckets, and UUID request deduplication. Five contact attempts per IP per 15 minutes are allowed. Success appears only after SQLite commits a record, or an identical retry finds its existing record. Failed requests retain input. The data directory is private and ignored; no retrieval API is exposed.

**No email delivery is configured or claimed.** Live notifications require a chosen provider, verified sender, server-only credentials, an authorized recipient, a delivery/retry implementation, and an actual inbox test.

## Production preparation

```sh
npm ci
npm run build
NODE_ENV=production npm start
```

The build copies public assets to `dist`; the Node process still handles `/api/contact`. Use a host supporting Node and a **persistent disk**, set an absolute private `DATA_DIR`, your exact HTTPS `PUBLIC_ORIGIN`, and host/port settings from [.env.example](.env.example). Set `HOST=0.0.0.0` behind your hosting platform’s HTTPS proxy as needed. See the proxy rate-limit considerations in OPERATIONS.md. `npm start` does not automatically read `.env`; export variables or use `node --env-file=.env server.js`.

**GitHub Pages or a static-only host cannot run this contact backend.** No optional deployment has been created or verified. Production domain, hosting, durable volume, backups, retention policy, and any inbox notifications remain operator configuration. The recruitment submission itself remains with the applicant.

## Verification

```sh
npm run lint
npm run format:check
npm run build
npm test
npx playwright install chromium
npm run test:browser
# With the local npm start server running:
node scripts/check-layout.js
npm audit
```

Browser tests start their own server on port 3100 with synthetic storage in ignored `artifacts/browser-data`, which is recreated on each run. They do not use the development inbox. Server tests use temporary directories and clean them up. Layout screenshots are ignored in `artifacts/`. If Chromium download is unavailable, an installed Chrome can be used with `PLAYWRIGHT_CHANNEL=chrome`.

Verified at **375, 768, and 1440 px**: no horizontal overflow; readable section layouts; image loading; working section anchors with sticky-header offset; mobile-menu pointer/keyboard behavior; official social destinations; no page script errors; automated WCAG A/AA checks through axe, including the lightbox. Reviewed screenshots for all three widths. Browser tests cover gallery pointer and keyboard operation, focus containment/restoration, reduced motion, empty/malformed form fields, aborted request preservation, duplicate clicks, and successful save through private CLI retrieval. A browser-submitted inquiry was also retrieved after a full process restart. API tests cover normalization, invalid fields, SQL injection treated as data, limits, tokens, private endpoints, idempotency, persistence, and database-write failure. Automated accessibility checks supplement the keyboard review; they do not constitute a full accessibility certification.

See [VERIFICATION.md](VERIFICATION.md) for the final results and remaining production limits.

## Content sources and asset credits

All sources were reviewed on **8 November 2026**. Copy and layout were written for this implementation; factual references are the society’s official pages. Content and media remain with SAHARA and their respective creators; no blanket license or ownership over third-party media is claimed.

- [Assignment brief](https://sahara.webxp.site/task.html) — retrieved directly; recruitment deadline 9 November 2026.
- [Official home](https://sahara-society.github.io/Sahara/index.html), [about](https://sahara-society.github.io/Sahara/about.html), [team](https://sahara-society.github.io/Sahara/team.html), [activities](https://sahara-society.github.io/Sahara/activities.html), [events](https://sahara-society.github.io/Sahara/events.html), and [contact](https://sahara-society.github.io/Sahara/contact.html) — affiliation, goals, archival roles, dates, society email, and social links.

| Local asset              | Source and treatment                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sahara-logo.jpeg`       | [New official logo](https://sahara.webxp.site/sahara-logo.jpeg), original JPEG, proportions preserved in header/footer                                                                                         |
| `volunteering.webp`      | [Official goal-3.png](https://sahara-society.github.io/Sahara/images/goal-3.png), outdoor volunteering photograph, WebP conversion, cropped only by layout. Source supplies no date/location; none is asserted |
| `community-collage.webp` | [Official goal-2.jpeg](https://sahara-society.github.io/Sahara/images/goal-2.jpeg), society-published collage, resized to 1500 px wide, WebP; shown intact, with dates/locations left unspecified              |
| `robin-session.webp`     | [Official goal-4.jpg](https://sahara-society.github.io/Sahara/images/goal-4.jpg), screenshot of Robin Singh guest session; WebP conversion; date from official events page                                     |
| `ritik.webp`             | [Ritik sir.png](https://sahara-society.github.io/Sahara/images/Ritik%20sir.png), official team portrait                                                                                                        |
| `shubhansh.webp`         | [Shubhansh.png](https://sahara-society.github.io/Sahara/images/Shubhansh.png), official team portrait                                                                                                          |
| `rishita.webp`           | [Rishita Sen.png](https://sahara-society.github.io/Sahara/images/Rishita%20Sen.png), official team portrait                                                                                                    |
| `parampreet.webp`        | [Parampreet Singh.png](https://sahara-society.github.io/Sahara/images/Parampreet%20Singh.png), official team portrait                                                                                          |
| `aayushi.webp`           | [Aayushi Sharma.png](https://sahara-society.github.io/Sahara/images/Aayushi%20Sharma.png), official team portrait                                                                                              |
| `omprakash.webp`         | [Omprakash.jpeg](https://sahara-society.github.io/Sahara/images/Omprakash.jpeg), official team portrait                                                                                                        |

Portraits were resized/cropped to 400 × 460 and converted to WebP; their historical roles match the official team page. Personal team emails were omitted. Aditya Raj (Secretary) and Aditya Kumar (Web Admin) are named in the 2026 recruitment brief and shown separately with initials because no portraits are supplied there. Other current appointments remain unverified. The activity pages reuse the Robin Singh screenshot, so it is only captioned as that session. The official Google Photos albums ([Udaipur](https://photos.app.goo.gl/7GPP2YZeiCj56ghVA), [Indore](https://photos.app.goo.gl/vqKPzd4GFJkNEQP46)) were unreachable from the development environment. The gallery uses available official-site media instead. A watermarked stock image on the old site was deliberately excluded. No generated imagery is used.

## Source map

- `public/` — semantic page, responsive styles, interaction code, local assets.
- `lib/app.js` — validation, spam controls, contact API, static serving.
- `lib/storage.js` — SQLite schema and private storage initialization.
- `server.js` — single-process startup and graceful shutdown.
- `scripts/` — build, private operator retrieval, layout checks, synthetic test server.
- `tests/` — server integration tests and Playwright/axe browser tests.

Generated assets, databases, submissions, local secrets, dependencies, logs, test output, and screenshots are excluded by `.gitignore`. ESLint’s transitive minimatch dependency is overridden to the patched 11.x line; lint and the full test suite validate the resulting toolchain.
