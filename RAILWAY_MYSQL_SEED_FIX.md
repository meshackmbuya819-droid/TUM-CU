# Railway MySQL Seed Fix

## What was fixed

Production database bootstrap now explicitly verifies the Railway MySQL connection before running either:

- `npm run db:seed`
- `npm run db:create-admin`

This prevents the application's development JSON/in-memory store from being used by a production bootstrap command.

The Docker startup sequence is:

```text
migrate -> seed -> server
```

The seed operation creates/updates reference and public CMS data such as ministries and the weekly spiritual rhythm. Events are intentionally bootstrapped after a real Super Administrator exists.

## Railway deployment

1. Replace the Railway source with this package / push it to the connected Git repository.
2. Confirm the Railway service has `NODE_ENV=production`.
3. Confirm Railway MySQL variables are available to the service:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
4. Redeploy and wait for the deployment to become healthy.
5. The container will automatically run migrations and seed public/reference data before starting the API.

## Create the first Super Administrator

Open the Railway service shell and run:

```bash
npm run db:create-admin -- --email YOUR_ADMIN_EMAIL --name "YOUR FULL NAME" --password "YOUR_STRONG_PASSWORD"
```

The command now refuses to operate if production MySQL cannot be verified.

Creating the Super Administrator also bootstraps the starter public event catalogue without overwriting existing events.

## Verify MySQL

From the Railway service shell:

```bash
node -e "const mysql=require('mysql2/promise'); mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME}).then(async c=>{for(const t of ['ministries','events','weekly_programmes']){const [r]=await c.query('SELECT COUNT(*) AS count FROM '+t);console.log(t+':',r[0].count)}await c.end()}).catch(e=>{console.error(e);process.exit(1)})"
```

Expected after seeding and creating the admin: ministries and weekly programmes should be non-zero; events should also be non-zero after the Super Administrator bootstrap.

## Important

Do not copy a Windows `node_modules` directory into the Railway/Linux deployment. Railway's Docker build installs Linux-compatible dependencies with `npm ci`.
