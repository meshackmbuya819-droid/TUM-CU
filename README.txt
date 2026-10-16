TECUMP leader portal access patch

Purpose
- Preserve the current leadership appointment/replacement/revocation workflow.
- Restrict dedicated portal routes to users with relevant active roles or permissions.
- Stop ordinary authenticated members from using the ministry leader-portal discovery endpoint just because they have ministries.view.
- Fix the ministry-portal controller's super-admin detection to use a real loaded permission rather than a '*' permission that is never populated.

Files in this patch (copy these paths over the same paths in the project):
- src/App.tsx
- src/components/RequirePermission.tsx
- backend/src/modules/ministries/routes/ministries.routes.ts
- backend/src/modules/ministries/controllers/ministries.controller.ts

Important
- This patch does not modify leadership assignment, replacement, or revocation services.
- Do not run database resets or destructive migrations.
- The librarian portal's role/permission identifiers should be confirmed against the production database before deployment; this patch allows the known library.create/library.edit permissions and system.manage_roles, plus librarian/library_manager role codes.
- Test on a branch or staging deployment first. Confirm ministry leaders can open their assigned portal, ordinary members are redirected, and appointment/replacement/revocation still behaves exactly as before.
