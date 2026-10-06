# TECUMP production authentication model

## Recommended model for 5,000+ members

TECUMP now uses **one authoritative authentication system**:

- **Credential store:** MySQL `users` table with `bcryptjs` password hashes.
- **Access authentication:** short-lived signed JWT access tokens.
- **Session renewal:** rotating, single-use refresh JWTs whose SHA-256 hashes are stored in MySQL.
- **Authorization:** database-driven RBAC/PBAC through `roles`, `permissions`, `role_permissions`, and `user_roles`.
- **Scoped authorization:** ministry/committee assignments are enforced with `scope_type` + `scope_id`.
- **Abuse protection:** login lockout plus API/authentication rate limiting.
- **Audit/security events:** authentication failures, successes, lockouts, refresh reuse and denied permissions are recorded server-side.

This is a better fit than Firebase Auth for this application because membership approval, constitutional roles, scoped ministry leadership, membership numbers, account states and audit history are all already authoritative in MySQL. Firebase would add a second identity source without solving the application's main authorization problem.

## Important security change

The old Firebase fallback has been removed. The previous implementation decoded arbitrary JWTs with `jwt.decode()` and treated claims such as `email`/`sub` as authentication. That is not valid token verification and could allow identity spoofing.

There is now no `/auth/firebase-login` endpoint and the API middleware accepts only access JWTs signed by `JWT_ACCESS_SECRET`.

## Scaling notes

5,000 registered members is not a large user count for this architecture. The important capacity variables are concurrent requests and database workload.

For production:

1. Use managed MySQL 8+ with backups.
2. Start with a connection pool around 20 connections and tune from observed database utilization.
3. Keep the database private.
4. Use HTTPS everywhere.
5. Generate unique high-entropy JWT secrets; never use the example/default values.
6. Keep `CORS_ORIGIN` explicit; never use `*` in production.
7. If you later run multiple API instances, move rate-limit state and other shared ephemeral state to Redis. The codebase already exposes `REDIS_URL` for that expansion.
8. Put a reverse proxy/load balancer in front of the application when scaling horizontally.
9. Do not use the JSON/disk memory store in production. Production database failures now fail closed instead of silently switching to a local data store.

## First administrator

There is no production default administrator password. After migrations and seed data are available, explicitly create the first administrator:

```bash
cd backend
npm run create:admin -- --email you@example.com --name "Site Administrator"
```

If `--password` is omitted, the script generates a strong password and prints it once.

## Browser token storage

The refresh token is now delivered only as a `HttpOnly` cookie scoped to the authentication API. The SPA keeps the short-lived access token for API calls; it no longer needs to read or persist the refresh token. This reduces the impact of an XSS vulnerability stealing a long-lived refresh credential.
