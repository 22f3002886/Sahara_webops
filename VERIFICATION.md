# Verification record

Verified locally on 8 November 2026, Node.js 22.14.0, macOS, Chromium (Playwright). Repository: https://github.com/22f3002886/Sahara_webops, branch `main`.

| Check                                                    | Result                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run lint`                                           | Passed                                                                                              |
| `npm run format:check`                                   | Passed                                                                                              |
| `npm run build`                                          | Passed; production assets in ignored `dist/`                                                        |
| `npm test`                                               | 7 integration tests passed                                                                          |
| `NODE_ENV=production npm run test:browser`               | 8 browser tests passed against production assets and a real SQLite handler                          |
| `node scripts/check-layout.js` against production server | Passed at 375, 768, 1440 px; all local images decoded; no page script errors or horizontal overflow |
| axe WCAG A/AA checks                                     | No reported violations at all three widths or in the open lightbox                                  |
| `npm audit`                                              | 0 vulnerabilities                                                                                   |
| GitHub repository                                        | Confirmed PUBLIC, default branch `main`                                                             |

## Reviewed behavior

- Hero, about/mission/vision, current verified roles and historical team, past events/activities, gallery, contact, and footer present. New logo appears in header and footer without distorted proportions.
- Actual full-page and viewport screenshots reviewed across phone, tablet, desktop. Images loaded before final screenshots. Responsive cards, image crops, form spacing, and no horizontal overflow verified.
- Section targets account for the sticky header. Mobile menu toggles with pointer, closes after navigation, and supports Escape with focus restored to its trigger. Footer links resolve to existing sections. Social links match official destinations and use meaningful labels and safe new-tab attributes. Remote social-platform account access/login behavior was not tested.
- Gallery opens with pointer/Enter, provides previous/next buttons and Left/Right keys with wrapping, closes with Escape or Close, contains Tab/Shift+Tab focus, and restores focus to the opener. Captions and original-image proportions are preserved in the modal.
- Browser inquiry: synthetic form submission accepted, button disabled while pending, duplicate submit event ignored, fields cleared only after acceptance, and saved row found through the private operator CLI. A separate browser-submitted record was retrieved after a full server shutdown/restart, including production-mode startup.
- Empty and malformed browser fields produce accessible errors; an aborted request preserves the message and shows an error instead of success. Direct API tests reject invalid fields, oversize payloads, malformed JSON, wrong content type, honeypot input, tampered/early/expired tokens, and wrong origins. Request limits, canonical routing, SQL parameterization, idempotent retries, and failure after an intentionally rejected database write are tested.
- SQLite files and synthetic submissions are ignored and untracked. Private retrieval is local and read-only; guessed public inquiry/database URLs return 404. Test databases are isolated from the development inbox.

## Limits and production handoff

- Aditya Raj (Secretary) and Aditya Kumar (Web Admin) are verified in the 2026 recruitment brief and displayed with initials. Six older profiles are marked historical; other current appointments are unverified.
- Official Google Photos albums could not be retrieved. Three available official-site media items are used, with cautious captions and source credits in README. A stock image with a visible watermark was excluded.
- No live deployment or inbox notification is configured or verified. Use a Node-capable host with persistent private disk, an exact HTTPS `PUBLIC_ORIGIN`, matching operator `DATA_DIR`, and the production commands in README. A static-only deployment cannot operate this API.
- Proxy trust must be configured for the actual host before relying on distinct per-visitor rate limits behind a reverse proxy; the default does not trust forwarded headers. Backups and real-data retention remain operator responsibilities.
- GitHub Actions configuration is included. The initial hosted run passed: https://github.com/22f3002886/Sahara_webops/actions/runs/42478648796.
- Node 22 prints its built-in SQLite experimental warning. The intentional write-failure test logs an `ERR_SQLITE_ERROR`; this is expected test coverage, not a failed check.
- Browser checks used Chromium; Safari, Firefox, and a full assistive-technology audit were not performed. No recruitment application was submitted.
