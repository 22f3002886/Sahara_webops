# SAHARA · Big hearts. Real change.

An original, responsive landing page for **SAHARA — The Social Welfare Society of the IIT Madras BS Degree community**, built for the WebOps recruitment assignment. Public source: https://github.com/22f3002886/Sahara_webops

## Run locally

Requires **Node.js 22.13+** and npm. Tested on Node 22.14.0. Node 22 emits an experimental warning for its built-in SQLite module; no separate database installation is needed.

```sh
npm ci
npm start
```

Open **http://localhost:3000**. One startup command serves the page and real contact API. `npm run dev` enables server reloads.

## What is included

| Section             | Implementation                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Hero                | Authentic official-site volunteering photo, new local logo, working in-page actions                                          |
| About               | IIT Madras BS affiliation, mission, vision, approach, qualitative impact presentation                                        |
| Team                | The twelve members on the reference team page, their roles, available biographies, and professional profiles                 |
| Events & activities | All six sourced past events, with on-page details, plus two full volunteering accounts                                       |
| Gallery             | Three official archive images, main viewer, thumbnails, full-size previews, captions, keyboard controls, and original albums |
| Contact             | Published society email, accessible validation, pending/failure states, SQLite or Neon PostgreSQL storage                    |
| Admin               | Password-protected `/admin` inbox, search, pagination, full message details, sessions and logout                             |
| Footer              | Four desktop columns: Join Us, Site Map, Useful Links, and email/social channels                                             |

The redesigned visual system combines oversized Bricolage Grotesque headlines, Source Sans 3 body text, expressive serif accents, warm orange, deep charcoal, and sage. An authentic photographic hero, detailed event cards, a user-controlled gallery viewer, complete team profiles, and a single desktop footer row give each section its own composition. Both open-source font families are served locally, with no third-party requests at runtime. Semantic HTML, CSS, and vanilla JavaScript keep the page small; Express provides a single origin for both assets and contact requests. Images are local WebP derivatives; the supplied JPEG logo is preserved without distortion. Historical outreach numbers and participant reflections are labelled and sourced; no current metrics, appointments, or events are invented.

## Contact and private operator retrieval

```sh
npm run inquiries -- 50
```

This operator command prints the latest 50 inquiries as private JSON. Without `DATABASE_URL`, it reads local SQLite; with it, the command connects to that PostgreSQL database. **Do not publish its output.** For hosted retrieval, set `ADMIN_PASSWORD` (16–256 characters) and visit `/admin`; the default username is `admin`, or set `ADMIN_USERNAME`. See [DEPLOYMENT.md](DEPLOYMENT.md) for Render + Neon setup.

The form includes eight inquiry purposes, optional last name and six optional identity choices. It validates and normalizes fields server-side, limits payloads to 12 KB, uses bound SQL parameters, signed expiring tokens, a honeypot, persistent rate buckets and UUID deduplication. Five contact attempts per IP per 15 minutes are allowed. Success appears only after the database commits the inquiry and email job together, or an identical retry finds the existing record. Failed requests retain input. Retrieval APIs require an authenticated admin session.

SMTP delivery is implemented with a persistent outbox and retries. Each inquiry targets `connectwithsahara@study.iitm.ac.in`, with its topic in the subject and all submitted details in the body. Configure the five `SMTP_*` variables in `.env.example` using [OPERATIONS.md](OPERATIONS.md). No live credentials are currently installed, so actual inbox delivery remains unverified. The public confirmation reports only that the database accepted the inquiry; delivery state remains private operational information.

## Production preparation

```sh
npm ci
npm run build
NODE_ENV=production npm start
```

The build copies public assets to `dist`; Node handles contact and admin APIs. For Render Free, set the Neon pooled URL as private `DATABASE_URL`, plus `ADMIN_PASSWORD`, `PUBLIC_ORIGIN`, `HOST=0.0.0.0` and `NODE_ENV=production`. PostgreSQL stores inquiries, signing secret, rate buckets and sessions outside Render's temporary filesystem. A configured PostgreSQL connection failure stops startup instead of silently falling back to SQLite. Local SQLite remains available without `DATABASE_URL`; durable hosting then requires a persistent disk. `npm start` does not automatically read `.env`; export variables or use `node --env-file=.env server.js`.

**GitHub Pages or a static-only host cannot run this backend.** The user's public deployment is https://sahara-webops.onrender.com. Neon/admin activation requires private Render settings and the live acceptance steps in [DEPLOYMENT.md](DEPLOYMENT.md). Backups, retention and optional email activation remain operator responsibilities.

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

Reference website design and original implementation: [Parampreet Singh](https://param302.bio.link). Reference text and media: [SAHARA Society](https://sahara-society.github.io/Sahara/).

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

Portraits were resized/cropped to 400 × 460 and converted to WebP; their historical roles match the official team page. Personal team emails were omitted. At the user’s request, the visible team follows the reference team page only. Recruitment-brief contacts are not displayed as team members. The activity pages reuse the Robin Singh screenshot, so it is only captioned as that session. The official Google Photos albums ([Udaipur](https://photos.app.goo.gl/7GPP2YZeiCj56ghVA), [Indore](https://photos.app.goo.gl/vqKPzd4GFJkNEQP46)) were unreachable from the development environment. The gallery uses available official-site media and also links to the two original albums. A watermarked stock image on the old site was deliberately excluded. No generated imagery is used.

Typography: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) (700) and [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) (400, 600, and 700), downloaded from the Google Fonts CSS service and fonts.gstatic.com. Local files are in `public/assets/fonts/`; the SIL Open Font License texts from the [Bricolage](https://github.com/google/fonts/blob/main/ofl/bricolagegrotesque/OFL.txt) and [Source Sans](https://github.com/google/fonts/blob/main/ofl/sourcesans3/OFL.txt) font packages are included alongside them.

## Source map

- `public/` — semantic page, responsive styles, interaction code, local assets, and licensed local fonts.
- `lib/app.js` — validation, spam controls, contact API, static serving.
- `lib/storage.js` — SQLite schema and private storage initialization.
- `lib/postgres.js` — TLS PostgreSQL pool, schema initialization and atomic inquiry/outbox writes.
- `lib/admin.js` — authentication, hashed sessions, login limits and protected retrieval.
- `public/admin/` — responsive login and submissions inbox, without embedded credentials.
- `server.js` — single-process startup and graceful shutdown.
- `scripts/` — build, private operator retrieval, layout checks, synthetic test server.
- `tests/` — server integration tests and Playwright/axe browser tests.

Generated assets, databases, submissions, local secrets, dependencies, logs, test output, and screenshots are excluded by `.gitignore`. ESLint’s transitive minimatch dependency is overridden to the patched 11.x line; lint and the full test suite validate the resulting toolchain.

## Reference completeness

[SOURCE_AUDIT.md](SOURCE_AUDIT.md) inventories every component on the six reference pages and records how it maps to this page. In addition to all six events and twelve archived profiles, the page includes the four goals, four ways of working, named awareness series, explicitly historical outreach figures, partner logos, trip locations, participant reflections, official albums, the AAU donation link, and membership access. The official Join Us link is `https://forms.gle/h4X3TSpWirGVixGW6`; it redirected to Google sign-in during verification, and no membership request was submitted.

The redundant footer collaboration input was removed at the user’s request; collaboration inquiries use the main Get in Touch form. Constitution, privacy policy, and code-of-conduct URLs are empty in the reference, so they are labelled as unpublished instead of creating broken links. Lorem ipsum biographies and personal phone/email links are not republished. Published professional profile links are retained.

Additional official assets: `ayush.webp`, `krishnan.webp`, `dhanush.webp`, `ankit.webp`, `devottam.webp`, and `akash.webp` are optimized from `Ayush Khade.jpg`, `keshava.jpg`, `Dhanush.jpg`, `Ankit Prajapati.png`, `Devottam Vaishnav.jpg`, and `Akash.jpg` in the reference site’s [images directory](https://github.com/sahara-society/Sahara/tree/main/images). Partner images `partner-aau.webp`, `partner-rha.webp`, `partner-boundless.webp`, and `partner-synapse.webp` come from `AAU logo.png`, `rha_logo.png`, `boundless logo.png`, and `synapse logo.png` in that directory. Portraits were resized/cropped to 400 × 460; logos were resized within 240 × 160 and retain their proportions.

The body and navigation typography uses locally hosted Source Sans 3 (`source-sans-3-400.ttf`, `source-sans-3-600.ttf`, `source-sans-3-700.ttf`), with `SOURCE-SANS-LICENSE.txt` included. Display headings retain Bricolage Grotesque and the serif accents. Paragraphs and controls are now generally 16–18 px, and navigation labels are at least 16 px. Decorative stickers and repeated outbound-arrow links were removed. Events expand on the page; the gallery has a stable main viewer, thumbnail selection, keyboard controls, and full-size previews rather than rotated image cards.

## Reference layout revision · 9 November 2026

The primary navigation and page reading order now match: Home → About Us → Activities → Events → Our Team → Contact. The gallery sits within Activities. About Us includes membership access, four goals, four ways of working, awareness series, and dated outreach figures. All six events and both full activity accounts remain, including testimonials, partner names, original albums, and the AAU donation link.

Our Team follows the reference page only, with twelve members, their roles, professional links, and the ten available biography summaries. The Contact section contains the Get in Touch form. One desktop footer row groups Join Us, Site Map, Useful Links, Contact channels, in four columns; it wraps into two columns on smaller screens. Larger spacing, two-column event cards, and white team cards on a blue background improve readability. Empty policy destinations remain labelled as unpublished.

## Dedicated gallery and email delivery · 9 November 2026

Gallery is now a separate section and navigation item after Events and before Our Team, with three distinct official photographs, full-size previews, and both original activity album buttons. Both Google Photos short links timed out during renewed access checks; their full photo collections could not be imported. The reference activity carousels repeat the same goal-4.jpg session screenshot, which is represented once rather than falsely attributed to different trips.

Contact email links show the label Email and open a mailto link to the society inbox. Hero, membership, activity, profile, and album actions have button styling. The footer stays in one desktop row. SMTP delivery with durable retries is implemented; real delivery requires private SMTP credentials and an official inbox check, as documented in OPERATIONS.md.

## Contact and button polish · 9 November 2026

Replaced white action buttons with coordinated green, terracotta, and soft sage treatments, including accessible decorative icons and hover/pressed states. The Contact form has a distinct header, consistent controls, visible focus and validation states, and a stronger submit action. Removed the redundant footer collaboration column and its JavaScript handler; four columns share the available desktop width and wrap on mobile. The inquiry backend and official link destinations are unchanged.
