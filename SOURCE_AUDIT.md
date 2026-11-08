# Official reference audit and implementation checklist

Audited 8 November 2026. This checklist inventories the six official pages, their actual HTML links/forms, and the reference JavaScript. The new page remains an original implementation. Current appointments are verified separately against the 2026 recruitment brief; the older site is an archive.

| Reference component                                                                      | Implemented treatment in this implementation                                                                                                                        |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home: society identity, IIT Madras BS affiliation, awareness/compassion/humanity mission | Hero and about copy                                                                                                                                                 |
| Home: learn more, Join Us, Collaborate With Us                                           | In-page about, official membership form, collaboration contact action                                                                                               |
| Header: Home, About, Activities, Events, Team, Contact and mobile menu                   | Working section anchors with explicit Events and Activities navigation                                                                                              |
| About: four goals                                                                        | Real-world welfare, awareness, practical volunteering, connecting willing students with welfare work                                                                |
| About: four ways of working                                                              | Offline volunteering, guest conversations, solution-focused competitions, awareness content                                                                         |
| About: Myth Buster, Health Tips, Know Your Revolutionary                                 | Named awareness series, with no fabricated new posts                                                                                                                |
| About: outreach                                                                          | 400+ contributors, 330+ WhatsApp members, 650+ LinkedIn followers, 380+ Instagram followers, 70+ YouTube subscribers, explicitly labelled historical source figures |
| Events: six entries                                                                      | Indore/RHA; Robin Singh session; Poster Making Competition; Animal Aid Unlimited; RAKSHAK; Orientation, with source dates and complete on-page summaries            |
| Activities: two trips                                                                    | Partner organizations, city/location highlights, known dates, volunteering details, source-reported outcomes                                                        |
| Activities: partner logos                                                                | Animal Aid Unlimited, Robin Hood Army, Boundless, Synapse from official local assets                                                                                |
| Activities: participant reflections                                                      | Source-based paraphrases, attributed by published name, grouped under the historical trips; no invented testimonials                                                |
| Activities: album links                                                                  | Official Udaipur and Indore album destinations, clearly labelled external albums                                                                                    |
| Activities: donation                                                                     | Official Animal Aid Unlimited donation destination; no donation collection on this site                                                                             |
| Activities: repeated photo carousel                                                      | Replace duplicated/misattributed screenshot with a curated, labelled gallery and accessible previews                                                                |
| Team: twelve historical profiles                                                         | All twelve names/roles, local portraits, available biography summaries, published professional profile links                                                        |
| Team: empty/lorem biographies                                                            | Say a biography was not supplied; do not invent it                                                                                                                  |
| Team: personal email/phone links                                                         | Omit per the user's original privacy instruction; use the society email for contact                                                                                 |
| Contact: first/last name, email, identity, purpose, message                              | First/full name, optional last name and identity, email, every purpose choice, and message; optional context is validated and saved privately                       |
| Contact: identity options                                                                | Individual, Student, Professional, Influencer, Organization, Social Activist                                                                                        |
| Contact: purpose options                                                                 | Volunteering, Join Core Team, Event Suggestion, Collaboration, Sponsorship, Social Activity Participation, Feedback, Other                                          |
| Contact: hosted form handler                                                             | Retain the verified local durable SQLite backend, rather than forwarding to an uncontrolled old Getform account                                                     |
| Footer: membership, site map, official socials and society email                         | Present with readable action labels                                                                                                                                 |
| Footer: collaboration email form                                                         | Prefill the main contact form with the email and Collaboration topic; do not invent a newsletter feature                                                            |
| Footer: Constitution, Privacy Policy, Code of Conduct                                    | The reference has empty URLs for all three. List as not published in the supplied source; do not add fake or broken links                                           |
| Footer: website code and designer credit                                                 | Link the assignment code and credit Parampreet Singh for reference-site content/media, distinct from this implementation                                            |
| Reference motion/interaction                                                             | Preserve usable menu, active section, event details and gallery navigation; replace auto-blurred carousels with user-controlled interactions                        |

## Source destinations

- Home: https://sahara-society.github.io/Sahara/index.html
- About: https://sahara-society.github.io/Sahara/about.html
- Events: https://sahara-society.github.io/Sahara/events.html
- Activities: https://sahara-society.github.io/Sahara/activities.html
- Team: https://sahara-society.github.io/Sahara/team.html
- Contact: https://sahara-society.github.io/Sahara/contact.html
- Membership: https://forms.gle/h4X3TSpWirGVixGW6 (redirect verified to Google Forms; Google sign-in required during inspection; no form submitted)
- Udaipur album: https://photos.app.goo.gl/7GPP2YZeiCj56ghVA
- Indore album: https://photos.app.goo.gl/vqKPzd4GFJkNEQP46
- AAU donations: https://www.animalaidunlimited.org/donation/
- Original code: https://github.com/sahara-society/Sahara

## Presentation corrections requested

Keep the approved display heading family. Replace Manrope paragraph/navigation text with a clearer body family, make navigation and labels materially larger, use normal case where practical, and remove ubiquitous external-arrow symbols. Put event and team details on this page. Replace the rotated gallery collage treatment with a clear, captioned collection and album access. Record source limitations precisely; never present old numbers or appointments as current.
