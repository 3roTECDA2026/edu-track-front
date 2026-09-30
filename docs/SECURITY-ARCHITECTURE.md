# Gate the edu-track-front SPA Behind Real Auth Before Handling PII

Frontend is a React 19 + Vite 8 SPA with seven unguarded routes and a mock login that navigates locally. It renders student PII, grades, and attendance with no session, no role gating, and no auth headers — treat it as a prototype shell until wired to a real backend session.

## Quick path

1. Add an auth session (token storage + `fetchApi` Authorization header) and a route guard that redirects unauthenticated users to `/login`.
2. Replace the mock `LoginPage` submit with a real `POST /api/auth/login` call plus RHF + Zod validation and error states.
3. Verify: direct navigation to `/students`, `/users`, `/attendance` without a session redirects to `/login`; API calls carry the token; `npm test` passes with guard + login tests.

## Details

### Architecture map

| Layer | Current state |
|-------|---------------|
| Shell | `src/App.tsx` -> `src/routes/AppRouter.tsx` (`BrowserRouter`); 7 public routes: `/login`, `/home`, `/courses`, `/attendance`, `/students`, `/calification-grid`, `/users`; `*` redirects to `/login` |
| Guard | None: no `ProtectedRoute`, no auth context, no role check; deep links render directly |
| UI | MUI 9 + institutional theme (`src/theme/theme.ts`); layout in `src/components/layout/`; feature tables/dialogs/filters per domain |
| Forms | RHF + Zod in students/users dialogs; `LoginPage` is the exception — raw `useState`, hardcoded defaults (`admin.escola` / `********`), client-only empty check, then `navigate('/home')` |
| Data | `src/services/api.ts` (`fetchApi` over `fetch`, JSON-only, `ApiError` on non-OK); domain services (`students`, `courses`, `users`) build query strings, no tokens, no refresh, no abort beyond pass-through `signal` |
| Config | `VITE_API_URL \|\| http://localhost:3000`; no `.env.example`; no per-environment config |
| Quality | Zero test files; `vitest` + Testing Library installed but `npm test` exits 1; ESLint present, no CI |

### Security posture

| Area | Status |
|------|--------|
| Authentication | Mock only: login never calls the backend, sets no session, stores nothing; `rememberMe` checkbox is dead state |
| Authorization | Missing: `/users` (admin) and `/calification-grid` render for anyone who types the URL |
| Validation | Split: good RHF + Zod on domain forms; login has no schema, no rate-limit/backoff, no error mapping from `ApiError` |
| Data access | Exposed: services fetch PII (DNI, guardians, addresses) with no credential; `usersMock.ts` / `gradesMock.ts` ship sample data in the bundle |
| Storage/XSS | Lower immediate risk (no token to steal yet) but no plan: introducing `localStorage` tokens without XSS review (escaping, `dangerouslySetInnerHTML` audit) would create one |
| Env/config | Risky default: silent fallback to `localhost:3000` can point a built deployment at the wrong backend; API base URL is the only config knob |
| Dependencies | Heavy client surface (MUI, RHF, Router 7) with no audit/lockfile-review step in CI |

### Prioritized findings

**P0 — fix before any shared environment**

- [ ] P0-1: All routes unguarded — direct URL access to students, attendance summaries, grade grid, and user admin.
- [ ] P0-2: Mock login with hardcoded credentials teaches the wrong flow and bypasses any future backend auth.
- [ ] P0-3: No auth header in `fetchApi` — even after backend adds auth, the SPA cannot authenticate until this is wired.

**P1 — fix before pilot with real data**

- [ ] P1-1: No role-based UI gating or route-level role map (admin vs teacher vs family views of the same pages).
- [ ] P1-2: Login UX gaps: no Zod schema, no server-error display, dead "forgot password" and "remember me" controls that imply unimplemented flows.
- [ ] P1-3: Remove or gate `usersMock.ts` / `gradesMock.ts` so sample PII never ships to production bundles.
- [ ] P1-4: Silent `VITE_API_URL` fallback + missing `.env.example` invites misconfiguration across environments.

**P2 — harden soon after**

- [ ] P2-1: Add token-refresh, 401 redirect-to-login, and minimal XSS/storage review before choosing `localStorage` vs httpOnly cookie.
- [ ] P2-2: Add guard + login + service tests (vitest) and wire `npm test` + ESLint into CI.
- [ ] P2-3: Add production build checks: security headers (via hosting), sourcemap policy, and dependency audit step.

## Checklist

- [ ] Reader can list which routes need guards and which need role checks.
- [ ] Reader knows exactly what `LoginPage` does today (nothing remote) and what it must do instead.
- [ ] Reader can wire `fetchApi` auth headers without re-reading every service file.
- [ ] Reader can remove mock data safely before a production build.

## Next step

Build the auth session + `ProtectedRoute` + real login call first (P0), then add role gating for `/users` and `/calification-grid`. See `SECURITY_GUIDE.md` (prototype posture note) and coordinate the token contract with `edu-track-back/docs/SECURITY-ARCHITECTURE.md`.

## Cross-repo integration notes (back)

- Backend currently exposes all `/api/*` without auth, uses open CORS, and returns `{ error, details }` via `errorHandler` (except attendance routes, which return `{ message }`) — frontend guards are UX only and never a substitute. Agree on: login endpoint, Bearer vs cookie transport, 401 vs 403 semantics, CORS origins, and a single error shape before implementing the SPA session. See `edu-track-back/docs/SECURITY-ARCHITECTURE.md`.
