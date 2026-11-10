# Verification record

## Latest storage/admin verification · 10 November 2026

This section supersedes older SQLite-only retrieval and deployment limitations below.

- PostgreSQL uses a TLS pool with certificate verification, additive schema setup, atomic inquiry/outbox writes and persistent signing secret/rate buckets/sessions. SQLite remains the local default when no database URL is configured.
- Sixteen server tests cover both storage paths, validated submit/retrieve, duplicate handling, durable PostgreSQL reopen (PGlite), authentication, protected search/pagination, expiry/revocation/credential rotation and login limits. PGlite executes PostgreSQL SQL locally; this does not claim a live Neon network test.
- Sixteen production browser tests cover the public site and admin workflow. Login/inbox checks at 375, 820 and 1440 px show no overflow or reported axe WCAG A/AA violations. Login and message screenshots were visually reviewed. A synthetic public-form submission is retrieved in the authenticated inbox, searched and opened. Session reload and logout work; malicious-looking HTML renders literally as text.
- Build, lint, formatting and dependency audit checks pass. Screenshots, databases, secrets and browser artifacts remain ignored.
- Hosted Neon acceptance requires private Render configuration and the submit/read/redeploy/read procedure in [DEPLOYMENT.md](DEPLOYMENT.md). Old SQLite rows are not imported automatically. Live email remains unconfigured.

Verified locally on 8 November 2026, Node.js 22.14.0, macOS, Chromium (Playwright). Repository: https://github.com/22f3002886/Sahara_webops, branch `main`.

| Check                                                    | Result                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run lint`                                           | Passed                                                                                              |
| `npm run format:check`                                   | Passed                                                                                              |
| `npm run build`                                          | Passed; production assets in ignored `dist/`                                                        |
| `npm test`                                               | 9 integration tests passed                                                                          |
| `NODE_ENV=production npm run test:browser`               | 12 browser tests passed against production assets and a real SQLite handler                         |
| `node scripts/check-layout.js` against production server | Passed at 375, 768, 1440 px; all local images decoded; no page script errors or horizontal overflow |
| axe WCAG A/AA checks                                     | No reported violations at all three widths or in the open lightbox                                  |
| `npm audit`                                              | 0 vulnerabilities                                                                                   |
| GitHub repository                                        | Confirmed PUBLIC, default branch `main`                                                             |

## Redesign verification

The final presentation uses local licensed fonts, an authentic photo hero, six detailed event cards, two volunteering accounts, a user-controlled gallery viewer, complete team profiles, and a working inquiry form. Section order is Home, About Us, Activities (including the gallery), Events, Our Team, and Contact. Scroll-aware navigation marks the current section; reduced-motion preferences disable animations. The full build, integration tests, browser tests, and three-width layout checks were rerun for this design.

## Reviewed behavior

- Hero, About Us with goals and ways of working, reference team, all six events, both activities, gallery, contact form, and compact footer present. New logo appears in header and footer without distorted proportions.
- Actual full-page and viewport screenshots reviewed across phone, tablet, desktop. Images loaded before final screenshots. Responsive cards, image crops, form spacing, and no horizontal overflow verified.
- Section targets account for the sticky header. Mobile menu toggles with pointer, closes after navigation, and supports Escape with focus restored to its trigger. Footer links resolve to existing sections. Social links match official destinations and use meaningful labels and safe new-tab attributes. Remote social-platform account access/login behavior was not tested.
- Gallery opens with pointer/Enter, provides previous/next buttons and Left/Right keys with wrapping, closes with Escape or Close, contains Tab/Shift+Tab focus, and restores focus to the opener. Captions and original-image proportions are preserved in the modal.
- Browser inquiry: synthetic form submission accepted, button disabled while pending, duplicate submit event ignored, fields cleared only after acceptance, and saved row found through the private operator CLI. A separate browser-submitted record was retrieved after a full server shutdown/restart, including production-mode startup.
- Empty and malformed browser fields produce accessible errors; an aborted request preserves the message and shows an error instead of success. Direct API tests reject invalid fields, oversize payloads, malformed JSON, wrong content type, honeypot input, tampered/early/expired tokens, and wrong origins. Request limits, canonical routing, SQL parameterization, idempotent retries, and failure after an intentionally rejected database write are tested.
- SQLite files and synthetic submissions are ignored and untracked. Private retrieval is local and read-only; guessed public inquiry/database URLs return 404. Test databases are isolated from the development inbox.

## Limits and production handoff

- Our Team displays the twelve reference-site members and roles. Ten available biographies are summarized; the two placeholder biographies are omitted. Recruitment-brief contacts and archive banners are removed at the user’s request.
- Official Google Photos albums could not be retrieved. Three available official-site media items are used, with cautious captions and source credits in README. A stock image with a visible watermark was excluded.
- No live deployment or live inbox delivery is configured or verified. SMTP delivery is implemented and tested with synthetic transports; activation requires private provider credentials. Use a Node-capable host with persistent private disk, an exact HTTPS `PUBLIC_ORIGIN`, matching operator `DATA_DIR`, and the production commands in README. A static-only deployment cannot operate this API.
- Proxy trust must be configured for the actual host before relying on distinct per-visitor rate limits behind a reverse proxy; the default does not trust forwarded headers. Backups and real-data retention remain operator responsibilities.
- GitHub Actions configuration is included. The initial hosted run passed: https://github.com/22f3002886/Sahara_webops/actions/runs/42478648796.
- Node 22 prints its built-in SQLite experimental warning. The intentional write-failure test logs an `ERR_SQLITE_ERROR`; this is expected test coverage, not a failed check.
- Browser checks used Chromium; Safari, Firefox, and a full assistive-technology audit were not performed. No recruitment application was submitted.

## Reference-completeness pass

All six reference pages and their original HTML form/link destinations were audited; see SOURCE_AUDIT.md. Verified six expandable events, two full activity accounts with partner logos and participant reflections, twelve historical profiles with biography summaries, all inquiry purposes/identities, the official membership link, and the four-column footer. API tests verify each inquiry purpose, optional context persistence, and migration of an existing seven-column inquiry table without losing records. No external forms were submitted.

## Typography and gallery refinement

Source Sans 3 replaces the previous body type, while display headings are retained. Browser checks assert the loaded body family, a hero paragraph size of at least 17 px, and navigation labels of at least 16 px. The gallery now uses a main preview, selectable thumbnails, Previous/Next controls, Home/End/Left/Right keyboard selection, full-size modal focus management, and explicit access to both official albums. Floating stickers and repeated arrow links were removed. The browser-to-CLI inquiry test now also verifies last name, Student identity, and Sponsorship purpose survive storage.

Additional overflow checks passed at 1024, 1280, and 1920 px.

## Reference layout revision · 9 November 2026

The primary navigation and page reading order now match: Home → About Us → Activities → Events → Our Team → Contact. The gallery sits within Activities. About Us includes membership access, four goals, four ways of working, awareness series, and dated outreach figures. All six events and both full activity accounts remain, including testimonials, partner names, original albums, and the AAU donation link.

Our Team follows the reference page only, with twelve members, their roles, professional links, and the ten available biography summaries. The Contact section contains the Get in Touch form. One desktop footer row groups Join Us, Site Map, Useful Links, Contact channels, in four columns; it wraps into two columns on smaller screens. Larger spacing, two-column event cards, and white team cards on a blue background improve readability. Empty policy destinations remain labelled as unpublished.

## Dedicated gallery and email delivery · 9 November 2026

Gallery is now a separate section and navigation item after Events and before Our Team, with three distinct official photographs, full-size previews, and both original activity album buttons. Both Google Photos short links timed out during renewed access checks; their full photo collections could not be imported. The reference activity carousels repeat the same goal-4.jpg session screenshot, which is represented once rather than falsely attributed to different trips.

Contact email links show the label Email and open a mailto link to the society inbox. Hero, membership, activity, profile, and album actions have button styling. The footer stays in one desktop row. SMTP delivery with durable retries is implemented; real delivery requires private SMTP credentials and an official inbox check, as documented in OPERATIONS.md.

## Contact and button polish · 9 November 2026

Replaced white action buttons with coordinated green, terracotta, and soft sage treatments, including accessible decorative icons and hover/pressed states. The Contact form has a distinct header, consistent controls, visible focus and validation states, and a stronger submit action. Removed the redundant footer collaboration column and its JavaScript handler; four columns share the available desktop width and wrap on mobile. The inquiry backend and official link destinations are unchanged.
