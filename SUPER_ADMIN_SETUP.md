# Super Admin setup

## Current MySQL / Express deployment

From the project root:

```bash
cd backend
npm install
npm run migrate
npm run seed
```

Create the first Super Administrator:

```bash
npm run create:admin -- --email admin@YOUR-DOMAIN --name "TUMCU Super Administrator" --password "REPLACE-WITH-A-STRONG-UNIQUE-PASSWORD"
```

Or let the script generate a one-time password:

```bash
npm run create:admin -- --email admin@YOUR-DOMAIN --name "TUMCU Super Administrator"
```

The generated password is printed once. Store it securely.

## Verify

Login at:

```text
/login
```

Then verify:

1. Admin Center is visible only to the Super Admin.
2. Secretary can approve membership but is redirected away from `/dashboard/admin`.
3. A leader assigned to a ministry sees the Ministry Leader Portal.
4. A NORET/SORET leader sees the E-Team portal.
5. A normal member sees the Member Dashboard.

Never commit the Super Admin password or `.env` file to GitHub.

## Supabase note

This account-creation script currently uses MySQL through the project's `mysql2` layer. If the database is moved to Supabase PostgreSQL, the database adapter and migration layer must first be ported to PostgreSQL; then the equivalent server-side bootstrap command should be run against the Supabase database.
