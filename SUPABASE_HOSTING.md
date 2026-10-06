# TECUMP / TUMCU — Supabase Hosting & Production Test Guide

## Important architecture note

This release is still a **MySQL + Express + custom JWT** application. It is not a direct Supabase/PostgreSQL drop-in.

Do **not** paste the existing `backend/src/database/migrations/*.sql` files into the Supabase SQL Editor: those migrations contain MySQL-specific syntax such as `ENGINE=InnoDB`, `ENUM`, `UUID()`, `CURDATE()`, `DATE_ADD`, `ON DUPLICATE KEY`, and MySQL named parameters.

Supabase provides PostgreSQL, Auth, Storage, Realtime and Edge Functions. The current Express server can be kept as the API layer, but a genuine Supabase database deployment requires a PostgreSQL port of the database adapter and migrations.

### Recommended production topology

    Browser
       |
       v
    HTTPS frontend (Vercel / Cloudflare Pages / Netlify)
       |
       v
    Express API (Railway / Render / Fly.io / VPS)
       |
       v
    Supabase PostgreSQL + Supabase Storage

This keeps the existing UI and API architecture while moving the authoritative database and media storage to Supabase.

---

## 1. Create the Supabase project

1. Create a new Supabase project.
2. Set a strong database password and store it securely.
3. Open **Connect** in the Supabase dashboard.
4. For a horizontally scaled backend, use the Supavisor transaction pooler connection (port 6543).
5. Use session/direct mode for operations that require persistent session state, such as some migration/admin workflows.

For current Supabase connection guidance, see the official documentation:
- Database connection and pooler modes
- Connection pooling and limits
- Supabase React quickstart

---

## 2. Do not expose the database password to the browser

The browser should only receive public frontend configuration.

Never place:
- PostgreSQL password
- JWT signing secret
- service-role key
- SMTP password

inside `VITE_*` variables.

The service-role key, if eventually used for server-side Supabase Storage/admin operations, belongs only in the API/worker environment.

---

## 3. PostgreSQL port required before using Supabase as the TECUMP database

The current backend imports `mysql2/promise` and expects MySQL SQL.

The PostgreSQL port must provide equivalents for:

- `mysql2/promise` -> `pg` or another PostgreSQL driver
- MySQL named parameters -> PostgreSQL `$1, $2, ...` or a compatible query helper
- `UUID()` -> `gen_random_uuid()`
- `NOW()` -> `now()`
- `CURDATE()` -> `current_date`
- `DATE_ADD(...)` -> PostgreSQL interval arithmetic
- MySQL `ENUM` -> PostgreSQL enum/check constraints
- `ENGINE=InnoDB` -> remove
- MySQL indexes -> PostgreSQL indexes
- `ON DUPLICATE KEY UPDATE` -> `INSERT ... ON CONFLICT ...`
- MySQL `GROUP_CONCAT` -> `string_agg`
- MySQL `IFNULL/COALESCE` differences where applicable
- MySQL boolean/`TINYINT` behavior -> PostgreSQL boolean/integer types

The safest route is to port the database layer first, run the complete test suite against a disposable Supabase project, and only then switch production.

---

## 4. Supabase Storage for photographs

For production-scale media, do not send large base64 images through the Express JSON API.

Create a Storage bucket such as:

- `tumcu-public-media`

Use folders such as:

- `landing/`
- `memorable-moments/`
- `e-teams/`
- `leaders/`
- `gallery/`

The browser uploads the image to Supabase Storage and stores only the resulting object path/public URL in PostgreSQL.

This reduces API memory pressure and makes the image layer independently scalable.

---

## 5. RLS/security model

There are two safe patterns.

### Pattern A — existing Express RBAC

Keep the current Express API as the only writer.

- Browser -> Express API
- Express authenticates JWT
- Express checks database roles/permissions
- Express -> Supabase PostgreSQL using a protected server connection

In this model, do not expose arbitrary application tables directly to anonymous users.

### Pattern B — Supabase Auth + RLS

A later migration can replace custom JWT login with Supabase Auth.

Then:

- `auth.users` is the authentication identity
- an application profile table stores TUMCU/TUM academic information
- role membership is stored in application tables
- Row Level Security controls member/leader/admin visibility

Do not mix client-side role checks with unrestricted database tables. A hidden Admin button is not a security boundary.

---

## 6. Required production environment

### Frontend

Set:

    VITE_API_URL=https://YOUR-API-DOMAIN/api/v1

If the frontend is eventually converted to direct Supabase access, then use the current Supabase public project URL/publishable key variables instead.

### API

Set:

    NODE_ENV=production
    PORT=3000
    API_PREFIX=/api/v1
    CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN

Use unique random values for:

    JWT_ACCESS_SECRET=...
    JWT_REFRESH_SECRET=...

Database variables depend on the PostgreSQL port:

    SUPABASE_DB_URL=postgresql://...

Do not commit real secrets.

---

## 7. Production test sequence

Run these tests in order.

### Authentication

1. Register a new TUM student.
2. Confirm the account is `pending_approval`.
3. Confirm the application appears in the membership approval queue.
4. Attempt login before approval; it should be rejected as pending.
5. Approve the application as Secretary.
6. Login with the member account.
7. Confirm the user lands at `/dashboard`.
8. Confirm the doctrinal/declaration page is not automatically displayed again.

### Secretary

1. Login as Secretary.
2. Open Membership.
3. Confirm pending applications are visible.
4. Approve an application.
5. Confirm the member receives a membership number.
6. Confirm the member appears in the register.
7. Confirm the Secretary can move through member pages.
8. Confirm PDF, Excel and CSV exports contain the register.
9. Confirm the Secretary cannot open `/dashboard/admin`.
10. Confirm direct API calls to Admin Center endpoints are rejected.

### Super Admin

1. Login as Super Admin.
2. Open `/dashboard/admin`.
3. Assign a ministry leader to a ministry.
4. Assign an E-Team chairperson to an E-Team.
5. Confirm the assigned leader can see only their scoped portal.
6. Confirm the leader cannot access Admin Center endpoints.

### E-Teams

1. Create an E-Team.
2. Edit its name.
3. Edit description, mission, vision, scripture, motto, meeting details and imagery.
4. Assign its leader.
5. Login as that leader.
6. Confirm the leader can access the E-Team portal.
7. Confirm the leader can manage only the assigned team.
8. Confirm another leader cannot edit that team.

### Memorable Moments

1. Super Admin opens Landing Media.
2. Add several pictures under Memorable Moments.
3. Give each picture a caption.
4. Save.
5. Open the public landing page in an incognito window.
6. Confirm the pictures and captions appear without changing the rest of the landing-page structure.

---

## 8. Load testing

Do not test "millions" by opening millions of browser tabs.

Test the bottlenecks separately:

- authentication requests per second
- concurrent dashboard requests
- member-register searches
- membership approvals
- event reads
- image upload/download traffic
- database connections
- export generation

The member register in this release uses server-side pagination and indexed queries. Do not replace it with `SELECT *` followed by JavaScript filtering.

For high-volume production, use:

- CDN for static assets
- object storage for images
- database connection pooling
- multiple stateless API instances
- a shared database
- background jobs for email/notifications
- monitoring and database backups
- asynchronous large exports

A million-row PDF is not a good interactive operation. Large exports should eventually become background jobs that produce a downloadable file rather than tying up an HTTP request.

---

## 9. Super Admin account

The project already includes:

    backend/src/database/create-admin.ts

For the current MySQL deployment:

    cd backend
    npm install
    npm run migrate
    npm run seed

Then:

    npm run create:admin -- --email admin@example.com --name "TUMCU Super Administrator" --password "USE-A-UNIQUE-STRONG-PASSWORD"

If you omit `--password`, the script generates a strong one and prints it once.

The script is deliberately not part of the seed process so a public repository cannot create a predictable default administrator.

After first login:

1. change the password if necessary,
2. verify the Super Admin role,
3. create/assign leadership roles from the Admin Center,
4. test a non-admin account in a separate browser.

---

## 10. What not to do

Do not:

- put a Supabase service-role key in `VITE_*`
- expose PostgreSQL directly to the browser
- paste MySQL migrations into Supabase
- give every leader `system.manage_roles`
- use a frontend-only Admin guard
- load every member/attendance row into Node.js
- store millions of images as base64 strings in database rows
- run a million-row PDF generation synchronously in an HTTP request
- deploy multiple API instances against separate databases

The authoritative source of truth must remain one shared production database.

