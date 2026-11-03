# Application architecture

## Workspace boundary

The repository root is the only dependency and command entry point. `backend` and `frontend` are npm workspaces sharing `package-lock.json`; nested lockfiles are rejected by the architecture check. Run `npm install`, `npm run dev`, and `npm run verify` from the root. Package-level scripts remain available for targeted debugging through npm workspace commands.

## Backend boundaries

- `server.js` is the legacy composition root. New domains must not add schemas, validation, or large route implementations directly to it.
- Domain schemas belong in `<domain>Models.js`.
- HTTP routes and authorization belong in `<domain>Routes.js`.
- Request normalization belongs in `<domain>Validation.js`. Route handlers must never spread an untrusted request body directly into a database create or update.
- Operational data corrections belong in versioned scripts under `src/migrations/`. Every migration must be dry-run by default and require `--apply` for writes.
- Server-owned fields—including ownership, role, sequence, archive, analysis, audit, correction, and lifecycle fields—must always be assigned by trusted server code.

The outreach domain is the reference implementation:

```text
backend/src/
  core/auth/accessPolicy.js centralized roles, aliases, and grants
  securityConfig.js       runtime secrets and shared origin policy
  siteSettingsRoutes.js   public/admin routes and audit boundary
  siteSettingsValidation.js safe public projection and admin DTO
  outreachModels.js       persistence and indexes
  outreachValidation.js   explicit request DTOs
  outreachRoutes.js       authorization and workflows
  migrations/             repeatable operational backfills
```

## Frontend boundaries

- Page modules orchestrate data and workflows.
- Reusable visual primitives belong in focused UI modules rather than inside page components.
- Role-specific workflows must remove inaccessible controls, not merely wait for the API to reject them.
- API errors use alert styling and successful operations use status styling.
- All controls need visible labels, keyboard focus treatment, disabled states, and responsive layouts.

The outreach frontend is organized as:

```text
frontend/src/
  app/AppProviders.jsx             application-level providers
  app/routes/lazyRoutes.jsx        route-level performance boundaries
  core/auth/access.js             canonical client role routing
  core/security/headSettings.js   trusted metadata only; never scripts
  features/outreach/index.js      stable feature import boundary
  shared/ui/RouteLoading.jsx      accessible route loading state
  outreach.jsx                    workflow state and API orchestration
  outreachUi.jsx                  reusable accessible presentation components
```

## Security rules

1. Deny by default at the API layer; frontend visibility is never an authorization control.
2. Use exact role and section grants for every protected workflow.
3. Preserve contact consent and assignment isolation on every read and write.
4. Normalize and allowlist all request fields before persistence.
5. Record material mutations in the activity trail.
6. Keep secrets outside source control and require strong production configuration.
7. Database-managed settings may configure safe metadata but may never execute HTML or JavaScript.
8. HTTP and Socket.IO must use the same explicit origin allowlist.
9. Run the root verification command before merging.

## Decomposition policy

`backend/src/server.js`, `frontend/src/pages.jsx`, and `frontend/src/components.jsx` are legacy composition modules. Their current line-count budgets are enforced by `scripts/check-architecture.mjs`; they may shrink but must not grow. New work belongs in feature folders with focused API, domain, validation, and UI modules. Extract existing domains incrementally, keeping route contracts stable and adding integration coverage before moving each boundary.

The router dynamically imports the legacy page collection and specialized workflow modules. This keeps existing exports and URLs compatible while preventing the entire administration system from blocking the initial public-page render. `check-architecture.mjs` rejects a regression to a static pages import.

`siteSettingsRoutes.js` is the next extracted backend reference boundary: public projection, administrative validation, persistence, and audit behavior are colocated while shared middleware remains injected from the composition root. This keeps existing endpoints stable during incremental extraction.

`core/auth/accessPolicy.js` is the canonical backend authorization policy. Role levels, staff membership, specialized-role defaults, section aliases, and computed permission names must not be duplicated in route modules. HTTP middleware may format responses, but its access decisions delegate to this pure policy so they remain directly testable.

Suggested target structure:

```text
backend/src/
  core/                 config, auth, middleware, observability
  domains/<domain>/     model, DTO, service, routes
  migrations/           dry-run-first, versioned data changes

frontend/src/
  app/                  router and providers
  core/                 auth, API client, security, design tokens
  features/<feature>/   routes, state, feature UI
  shared/ui/            accessible reusable primitives
```

## Required verification

```powershell
cd "C:\VS CODE\Self Excellence\Updated-Self"
npm run verify
```

CI runs the same gate for every pull request and for pushes to the protected default branch.
