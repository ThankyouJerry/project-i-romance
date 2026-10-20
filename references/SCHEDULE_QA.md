# Schedule implementation checks

## Scope

New static `dist/schedule.html` page plus home entry card. Existing romance and merge game code and save keys are untouched. The roster exactly matches existing CAST IDs including `ori` (오리고기). No current source schedules were available for verification, so the published JSON is empty. Demo data requires the explicit example tab.

## Passed before publication

- All ten Node suites: addressing, collection-after, continuity-history, gift-notes, merge, merge-ui, story, visual-state, schedule, schedule-ui.
- Syntax checks for both schedule JavaScript files and `git diff --check`.
- New pure-rule suite: 11-member equality, KST midnight rollover in a non-Korean runtime, Monday weeks, leap dates/calendar/year boundaries, overnight events, cancellation/unknown-time handling, safe source URL protocols, malformed/prototype/array member rejection, duplicate IDs, demo isolation, and unchanged game paths/storage.
- Independent static review; corrected inherited member-key acceptance, aggregate/public+draft 1,500-event cap, exported document validation, draft print provenance and cross-year date headings.

The schedule-ui suite executes the actual app script against a DOM/storage/fetch harness: GitHub Pages subpath resolution, private/public/demo separation, save persistence, literal unsafe text rendering, full JSON export, malformed/cancelled imports, merge behavior, unreadable storage preservation, combined 1,500-event limit and cross-year headings. This is behavior verification, not browser layout verification.

## Browser verification

Pending live HTTP(S) verification. Local Chromium and HTTP preview could not start because this cloud command sandbox disallows sockets; escalation failed before execution due to an infrastructure read-only mount error. The cloud browser prohibits `file:` URLs. No browser-rendering pass is claimed by this pre-publication report. Use the existing GitHub Pages HTTP(S) deployment for final interactive, responsive, PNG, import/export and print checks.

## Explicit behavior and limitations

- Public JSON is read every 60 seconds while visible; this is not source scraping, actual livestream status, or real-time multi-user editing.
- Local drafts never publish themselves. JSON is the reviewed, deployable hand-off.
- Image intake is browser-local visual reference, not OCR. Bulk text paste is explicit pipe-delimited input with preview before saving.
- PNG and print reflect selected dates/member; JSON exports the entire merged dataset to prevent accidentally omitting other members.
- Cancelling an event preserves its record. No delete operation is provided.
- Browser storage failures are disclosed. Invalid stored data is left untouched. Imports merge rather than silently deleting missing records.
- No paid API, credentials, external runtime scripts, backend or new packages are used.
