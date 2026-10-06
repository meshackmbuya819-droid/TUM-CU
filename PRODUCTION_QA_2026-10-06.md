# TECUMP Production QA — 6 October 2026

## Authentication
- MySQL-backed password authentication is authoritative.
- JWT access + rotating refresh-cookie model is retained.
- Firebase token decoding/bypass paths are removed.
- Production database failures fail closed rather than switching to the in-memory store.

## Membership
- Application approval/rejection remains database-backed.
- Approved members enter the registered membership list.
- Membership register supports paged retrieval and explicit PDF, Excel and CSV downloads.
- Secretary has `membership.view_all` and can use the register/export controls.

## Leadership / RBAC
- Leadership appointments create durable `leadership_assignments` records.
- Appointments synchronize constitutional roles into `user_roles`.
- Ministry leadership is scoped to the appointed ministry.
- E-Team leadership is scoped to the appointed E-Team.
- Replacing a ministry/E-Team leader ends the previous scoped role.
- E-Team chair permissions now match the actual routes (`eteams.manage_*`).
- Secretary and Chairperson have contact-inbox permissions.

## Ministries
- Public ministry pages read the live database; fake hard-coded ministry data is no longer used as an error fallback.
- Super Admin ministry editing persists descriptions, meeting information, landing visibility, captions, display order and leader.
- Ministry uploaded cover/background images are stored in the configured persistent upload directory and the authoritative URL is written to MySQL.
- Ministry leader candidates are loaded from registered members instead of hard-coded sample people.
- Leader assignment enforces active Full Member + Year 2 eligibility server-side.

## E-Teams
- Canonical names are persisted: `NET MINISTRIES TRUST TUM UNIT` and `NORET-SORET`.
- Super Admin can edit complete team metadata and durable cover/banner/logo URLs.
- Chairperson operations are scope-checked against the selected team.
- Programme, announcement, gallery and report operations are permission protected.
- Replacing an E-Team chairperson revokes the previous scoped chair role.

## Landing page / media persistence
- Hero slides, rotation interval, background image, rotating backdrop slides and gallery are persisted to MySQL.
- A successful save now fails if backdrop persistence fails instead of silently reporting success.
- Uploaded images are stored under `UPLOAD_DIR`; Docker Compose maps this to a persistent volume.
- Production landing-media initialization fails closed if the MySQL configuration cannot be loaded.

## Contact / correspondence
Official public contact information:
- Email: `tumchristianunion@gmail.com`
- Phone / WhatsApp: `0799762001` — TUMCU Secretary
- Location: `Technical University of Mombasa, Tom Mboya Street, Mombasa, Kenya`

A submitted contact message is persisted and creates both:
1. an in-app notification for every current Secretary, Chairperson and Super Admin; and
2. a durable email notification job for those recipients.

Real email delivery requires SMTP credentials (recommended: Gmail SMTP with an App Password for the official TUMCU account).

## Events
- Public event listing uses the API.
- Upcoming events are date-driven by the backend event records and are separate from weekly programmes.
- Event detail fields include event type, speaker/preacher, topic/theme, date/time, venue and banner.
- The client no longer invents a fake calendar metadata response when the calendar API is unavailable.

## Verification performed
- Root TypeScript check: PASS
- Backend TypeScript check: PASS
- Source scan for `jwt.decode` authentication bypass: CLEAN
- Source scan for hard-coded ministry leader candidates: CLEAN
- Source scan for Firebase login bypass: CLEAN
- Production package excludes `node_modules`; deployment should run a fresh `npm install`/`npm ci`.

## Important deployment requirement
The supplied ZIP intentionally does not contain `node_modules`. Run `npm install` or `npm ci` after extraction so the deployment host installs its own native Vite/esbuild binaries. Configure MySQL, JWT secrets, CORS and SMTP before production startup.
