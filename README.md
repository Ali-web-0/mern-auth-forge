# mern-auth-forge

> A production-grade MERN authentication & authorization boilerplate — refresh token rotation with theft detection, RBAC, ownership-scoped data access, structured error handling, and double (client + server) validation. Free, open source, built to be cloned and extended.

Most "MERN auth tutorial" repos stop at `jsonwebtoken.sign()` and a login form. This one goes further: it's built around the patterns that actually separate a toy auth demo from something you'd ship, and every non-obvious decision is explained inline in the code, not just in this README.

## Why this exists

A basic JWT login flow is maybe 10% of what real auth requires. The other 90% — token theft detection, session revocation, role checks that can't be bypassed, ownership checks that live in the query instead of an `if` statement someone can forget, validation that never trusts the client, errors that don't leak internals — is what this repo demonstrates. Clone it, read `server/src/services/auth/`, and you'll see the whole pattern in about 200 lines.

## Features

- **Register / login** with bcrypt password hashing (cost factor 12) and duplicate-email handled as a clean, typed error — not a raw 500.
- **Refresh token rotation with reuse detection.** Every refresh issues a new token and invalidates the old one. If an already-rotated (stolen) token is ever replayed, the entire token family is revoked and every session tied to it is forced to re-authenticate.
- **RBAC middleware** (`authorize('admin')`) that's a separate concern from authentication — "who are you" and "what are you allowed to do" never get conflated.
- **Ownership-scoped example resource** (`/api/notes`) demonstrating the query-level scoping pattern: `ownerId` lives inside the Mongo filter itself, so there's no code path that can leak another user's data even if a future controller forgets to check.
- **Password reset flow** with enumeration-safe responses (the API never reveals whether an email is registered), real email delivery via Resend (optional — falls back to logging the link to the console if unconfigured), and automatic session revocation on reset.
- **Rate limiting** on auth endpoints and **security headers** (`helmet`) with an explicit CORS allowlist — never `*`.
- **Fail-fast configuration.** Environment variables are validated with Zod once at boot; the app refuses to start with a clear error instead of failing silently three requests later.
- **A real test pyramid**: unit tests for pure logic, integration tests against an in-memory MongoDB, and one end-to-end Playwright flow through the actual browser.

## Architecture

The backend is organized in layers, and each layer has exactly one job:

```
routes/       thin — wires an HTTP verb + path to a controller, nothing else
controllers/  parse input (Zod), call the service layer, shape the HTTP response
services/     all business logic, organized as "vertical slices" (auth/, notes/, users/)
models/       Mongoose schemas — the only place that knows about the DB shape
lib/          cross-cutting utilities: env validation, errors, tokens, cookies, mailer
middleware/   authenticate (who are you), authorize (what can you do), rate limiting, errors
```

A few decisions are worth calling out explicitly, because they're the parts that get skipped in most tutorials:

**Errors are values, not surprises.** Every expected failure (bad password, duplicate email, note not found) is a `BusinessError` subclass with a stable `.code`. The global error middleware (`middleware/errorHandler.ts`) is the only place that decides HTTP status codes, so a controller never has to remember "which status code means duplicate email" — it just throws, and the shape of the response (`{ success, data, error }`) is identical everywhere in the API.

**Every service folder is a vertical slice, not a horizontal layer.** `services/auth/`, `services/notes/`, `services/users/` each get their own `types.ts`, `queries.ts`, `mutations.ts`, and a barrel `index.ts` that's the *only* import path the rest of the app is allowed to use. This keeps a growing app from turning into one 2,000-line `userService.ts`.

**Ownership scoping happens in the query, not after it.** Look at `services/notes/queries.ts`: `Note.findOne({ _id: noteId, ownerId })`. The owner check isn't a separate `if (note.ownerId !== userId)` after the fetch — it's baked into the filter, so there's no way to write a new endpoint that accidentally skips it. A non-owner's request to someone else's note returns 404, not 403 — the API never confirms that a resource you don't own even exists.

**Refresh tokens are hashed at rest and rotated on every use.** The raw token is returned to the client exactly once and never stored; only its SHA-256 hash lives in MongoDB, in a `RefreshToken` document tagged with a `familyId`. Rotating a token marks the old one revoked and issues a new one in the same family. If a revoked token is ever presented again — the signature of a stolen-and-replayed token — the whole family is revoked, forcing re-login everywhere that session was active. See `services/auth/refreshTokens.ts`.

**Validation happens twice, on purpose.** The exact same Zod shape (`RegisterSchema`, `LoginSchema`, etc.) is defined once conceptually and implemented in both `server/src/controllers/auth.schema.ts` and `client/src/lib/auth.schema.ts`. The client copy gives instant form feedback; the server copy is what actually matters, because the client can never be trusted. Neither one is optional.

**The access token never touches disk.** It's returned in the JSON response body and held in memory on the client (see `client/src/lib/api.ts`) — never `localStorage`, so an XSS bug can't read it off the page. The refresh token lives in an `httpOnly` cookie scoped to `/api/auth`, invisible to client-side JavaScript entirely. When an access token expires mid-session, `apiFetch` transparently retries once through `/api/auth/refresh` and replays the original request — the UI never sees a 401 it doesn't already understand how to handle.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TypeScript |
| Frontend forms | React Hook Form + Zod |
| Frontend data | TanStack Query |
| Frontend styling | Tailwind CSS v4 + shadcn/ui (copied source, not a dependency) |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | MongoDB + Mongoose 9 |
| Validation | Zod |
| Auth | JWT (access + refresh), bcrypt |
| Linting/formatting | Biome |
| Testing | Vitest (unit + integration) + Playwright (E2E) |

## Project structure

```
mern-auth-forge/
├── client/                 React app (Vite)
│   └── src/
│       ├── components/     presentational components + shadcn/ui primitives
│       ├── context/        AuthContext — current user, backed by TanStack Query
│       ├── features/       API calls per domain (auth/, notes/)
│       ├── hooks/          useAuth, useLogin, useRegister, useLogout
│       ├── lib/            api client (token refresh handling), zod schemas, utils
│       └── pages/          route-level views
│
├── server/                 Express API
│   └── src/
│       ├── routes/         auth.routes.ts, admin.routes.ts, notes.routes.ts
│       ├── controllers/    validate → delegate to service → shape response
│       ├── services/       auth/, notes/, users/ — vertical slices
│       ├── models/         User, RefreshToken, PasswordResetToken, Note
│       ├── middleware/     authenticate, authorize, rateLimit, errorHandler
│       └── lib/            env, errors, actionResult, tokens, cookies, mailer, db
│   └── tests/
│       ├── integration/    setup for mongodb-memory-server
│       └── e2e/            Playwright, one critical flow
│
├── MERN_Best_Practices_Checklist.md   the principles this repo is built from
├── SPEC.md                            full technical specification
└── biome.json
```

## Getting started

**Prerequisites:** Node.js 24+, and a MongoDB instance (local `mongod` or a free [Atlas](https://www.mongodb.com/atlas) cluster).

New to this stack, or want a slower, more detailed walkthrough (including step-by-step Atlas setup)? See **[SETUP.md](./SETUP.md)**.

```bash
git clone https://github.com/<your-username>/mern-auth-forge.git
cd mern-auth-forge
npm install

# Server config
cp server/.env.example server/.env
# then edit server/.env — at minimum set MONGODB_URI and a real JWT_ACCESS_SECRET

# Client config
cp client/.env.example client/.env
```

Run both dev servers (in separate terminals):

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Visit `http://localhost:5173`, register an account, and you're in.

## Email setup (optional)

Password reset links work without any email provider configured — `RESEND_API_KEY` is left blank by default, and in that state `server/src/lib/mailer.ts` just logs the reset link to your server terminal instead of sending it. That's enough to test the whole flow locally with zero signup.

To send real email:

1. Create a free account at [resend.com](https://resend.com) and grab an API key from the dashboard.
2. Set `RESEND_API_KEY` in `server/.env`.
3. Leave `EMAIL_FROM=onboarding@resend.dev` as-is for testing — Resend's shared sandbox address works without verifying a domain, but it will **only deliver to the email address you signed up to Resend with**. To send to arbitrary recipients (i.e. real users), verify your own domain in the Resend dashboard and set `EMAIL_FROM` to an address on it (e.g. `noreply@yourdomain.com`).

Swapping providers entirely (SES, Postmark, etc.) means editing only `lib/mailer.ts` — nothing else in the auth flow depends on which provider is behind it.

## API reference

All responses share one shape: `{ success: true, data }` or `{ success: false, error: { message, code } }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Issue access + refresh token |
| POST | `/api/auth/refresh` | refresh cookie | Rotate tokens |
| POST | `/api/auth/logout` | refresh cookie | Revoke the current session |
| POST | `/api/auth/logout-all` | access token | Revoke every session for the user |
| POST | `/api/auth/forgot-password` | — | Request a reset link (real email via Resend, or logged to console if unconfigured) |
| POST | `/api/auth/reset-password` | reset token | Set a new password |
| GET | `/api/auth/me` | access token | Current user profile |
| GET / POST | `/api/notes` | access token | Ownership-scoped example resource |
| GET / PATCH / DELETE | `/api/notes/:id` | access token | Same resource, single-item operations |
| GET | `/api/admin/users` | access token + `admin` role | RBAC-protected example route |

## Testing

```bash
npm run test:server:unit   # pure logic — tokens, errors, ActionResult, Zod schemas
npm run test:server:int    # full API flows against an in-memory MongoDB
npm run test:e2e           # one Playwright flow through the real browser + dev stack
```

The E2E suite spins up the real client and server (see `server/playwright.config.ts`) and needs an actual reachable MongoDB — unlike the integration tier, which uses `mongodb-memory-server` and needs nothing installed.

## Security notes

Passwords are hashed with bcrypt at a cost factor of 12 (configurable via `BCRYPT_SALT_ROUNDS`); swapping to argon2id is a reasonable alternative if you'd rather standardize on it. Access tokens are short-lived (15 minutes by default) and never persisted; refresh tokens are long-lived (7 days by default), rotated on every use, and stored only as a SHA-256 hash — a database leak alone doesn't hand out a usable token. Environment variables are validated once at process start, so misconfiguration fails loudly at boot instead of quietly in production.

## Roadmap / good first issues

This repo intentionally stops short of a few things that make good first contributions:

- OAuth / social login (Google, GitHub)
- Email verification on signup
- 2FA / MFA (TOTP)
- An admin endpoint to promote/demote user roles (currently role changes are DB-only, on purpose — see `services/users/`)
- Argon2id as a configurable alternative to bcrypt
- Account lockout after repeated failed login attempts, on top of the existing rate limiter

PRs welcome. If you're picking one of these up, open an issue first so we don't duplicate work.

## License

MIT — use this in your own projects, no attribution required (though a star is always appreciated).
