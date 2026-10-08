# TECUMP Railway Production Recovery & Deployment

## What was wrong

1. The runtime Docker image copied `dist` and `public`, but **not `backend/`**.
   The old root scripts therefore failed inside Railway with:
   `/app/backend/package.json: ENOENT`.
2. Production startup ran migrations but **never ran the reference/content seed**.
   Migrations create tables; they do not populate the ministry catalogue.
3. The project contained a large local JSON snapshot (`data/tecump_store.json`) with
   ministries, weekly programmes and events. Development could appear populated from
   that snapshot, while production correctly switched to MySQL and therefore saw an
   empty database.
4. The weekly-programme API could send values such as `fellowship` or `empowerment`
   that did not match the original MySQL enum. The API now normalizes those values.
5. Production configuration needs an explicit `JWT_REFRESH_SECRET`; otherwise the
   security checks reject the deployment because the schema default is intentionally
   insecure.
6. Uploaded media requires a Railway Volume mounted at `/app/data/uploads` if it must
   survive redeploys/restarts.

## What this package changes

- Bundles `migrate`, `seed`, and `create-admin` into production `dist/*.cjs` files.
- Changes root database commands to use those compiled files.
- Runs migrations and the safe reference/content bootstrap before the server starts.
- Seeds the 12 constitutional ministries with their public descriptions/images.
- Seeds the 6 weekly spiritual-rhythm programmes.
- After a real Super Admin is created, safely seeds the existing public event catalogue.
- Uses `INSERT IGNORE`/fill-empty logic so deployment restarts do **not overwrite admin edits**.
- Normalizes invalid weekly programme types before MySQL writes.
- Adds a production `.gitignore` and removes the sensitive local database snapshot from
  the deployment package.
- Adds the missing `JWT_REFRESH_SECRET` production configuration.
- Creates `/app/data/uploads` in the runtime image.

## Railway environment variables

In the TECUMP app service, configure:

- `NODE_ENV=production`
- `DB_HOST` = Railway MySQL `MYSQLHOST`
- `DB_PORT` = Railway MySQL `MYSQLPORT`
- `DB_USER` = Railway MySQL `MYSQLUSER`
- `DB_PASSWORD` = Railway MySQL `MYSQLPASSWORD`
- `DB_NAME` = Railway MySQL `MYSQLDATABASE`
- `JWT_ACCESS_SECRET` = a unique random secret
- `JWT_REFRESH_SECRET` = a different unique random secret
- `CORS_ORIGIN` = the exact HTTPS public URL of TECUMP
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=lax`
- `UPLOAD_DIR=/app/data/uploads`

If you use a custom domain, put that domain in `CORS_ORIGIN`. If both Railway and
the custom domain are used as frontends, separate them with commas.

## Railway Volume

Create/attach a persistent Railway Volume and mount it at:

`/app/data/uploads`

Without this, uploaded ministry/landing/gallery images can disappear after a new
deployment or container replacement.

## First deployment

The container startup now runs:

1. `node dist/migrate.cjs`
2. `node dist/seed.cjs`
3. `node dist/server.cjs`

This creates the database schema and reference/public ministry/weekly data.

## Create the Super Admin

Open a Railway shell for the **TECUMP application service** and run:

```bash
npm run db:create-admin -- --email YOUR_EMAIL --name "Your Full Name" --password "YOUR_STRONG_PASSWORD"
```

The command now works in the production image because `dist/create-admin.cjs` is
included. It also seeds the event catalogue using the new Super Admin as the event
organizer.

## Verify the public API

After deployment, these should return data:

```text
https://YOUR-DOMAIN/api/v1/ministries
https://YOUR-DOMAIN/api/v1/events/public
https://YOUR-DOMAIN/api/v1/programmes
https://YOUR-DOMAIN/health
https://YOUR-DOMAIN/health/ready
```

Expected:
- `/ministries` -> 12 initial ministries
- `/programmes` -> 6 weekly programmes
- `/events/public` -> upcoming approved events
- `/health/ready` -> database `true`

## Important security cleanup

The old `data/tecump_store.json` contained user records, password hashes, refresh-token
hashes, phone/email data and security-event history. Do not commit that file to a public
repository. If it has ever been pushed to GitHub/GitLab, remove it from the repository
and consider the affected credentials/tokens compromised.

For an existing Git repository:

```bash
git rm --cached data/tecump_store.json
git add .gitignore
git commit -m "Remove production database snapshot"
git push
```

If sensitive data was pushed into public history, ordinary deletion is not enough; rewrite
the repository history and rotate any credentials/tokens that could have been exposed.

## Re-deployment

After replacing the project files:

```bash
git add .
git commit -m "Fix Railway production bootstrap and public content"
git push origin main
```

Railway should build the Dockerfile, run a fresh `npm ci`, build the production bundles,
run migrations + safe bootstrap, and start the server.
