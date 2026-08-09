# mern-auth-forge — Technical Specification

> Production-grade MERN authentication & authorization boilerplate. Built on the layered-architecture, validation, and error-handling principles documented in `MERN_Best_Practices_Checklist.md`. Free, open source, designed to be cloned and extended.

---

## 1. Goals

- A real, production-grade auth starter — not another basic "JWT login tutorial" repo.
- Demonstrate: refresh token rotation, RBAC, double validation (client + server), structured error handling, tenant/ownership scoping pattern, and a proper testing pyramid.
- Clean enough that someone skimming the repo in 5 minutes understands the architecture and trusts the code quality.

---

## 2. Tech Stack (latest stable, Aug 2026)

| Layer | Choice | Version |
|---|---|---|
| Frontend | React | 19.2.x |
| Frontend build tool | Vite | latest |
| Frontend language | TypeScript | latest 5.x |
| Frontend forms | React Hook Form + Zod | latest |
| Frontend HTTP/state | TanStack Query (React Query) | latest |
| Frontend styling | Tailwind CSS | latest v4 |
| Frontend UI components | shadcn/ui (copied source, not a dependency) | latest |
| Backend runtime | Node.js | 24.x LTS |
| Backend framework | Express | latest 5.x |
| Backend language | TypeScript | latest 5.x |
| Database | MongoDB | 8.x (Atlas or local) |
| ODM | Mongoose | 9.9.x |
| Validation | Zod | latest v4 |
| Auth | JWT (access + refresh), bcrypt/argon2 for hashing | — |
| Linting/formatting | Biome | latest |
| Testing | Vitest (unit/integration) + Playwright (E2E) | latest |

**Sources for version currency:** [React 19.2.8 release](https://github.com/react/react/releases/tag/v19.2.8) · [Node.js 24 LTS status](https://endoflife.date/nodejs) · [Mongoose 9.9.1 on npm](https://www.npmjs.com/package/mongoose)

---

## 3. Architecture (per MERN Best Practices Checklist)

```
mern-auth-forge/
├── client/                          # React app (Vite)
│   ├── src/
│   │   ├── components/              # PascalCase, presentational only
│   │   │   └── shadcn/              # copied shadcn/ui primitives (button, input, form, card…)
│   │   ├── hooks/                   # useAuth, useLogin, useRegister (React Query wrappers)
│   │   ├── pages/                   # route-level views
│   │   ├── lib/                     # api client, zod schemas shared with backend shape
│   │   ├── context/                 # AuthContext (current user, tokens)
│   │   └── index.css                # Tailwind entry + theme tokens
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── server/                          # Express API
│   ├── src/
│   │   ├── routes/                  # thin — wires HTTP verbs to controllers only
│   │   │   └── auth.routes.ts
│   │   ├── controllers/             # validate → resolve context → delegate to service
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   └── auth/
│   │   │       ├── index.ts         # public exports only
│   │   │       ├── queries.ts
│   │   │       ├── mutations.ts     # register, login, refresh, revoke
│   │   │       └── types.ts
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.model.ts
│   │   │   └── RefreshToken.model.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts      # verifies access token
│   │   │   ├── authorize.ts         # RBAC role/permission check
│   │   │   └── errorHandler.ts      # global error middleware
│   │   ├── lib/
│   │   │   ├── errors.ts            # BusinessError, AuthorizationError
│   │   │   ├── actionResult.ts      # consistent { success, data, error } shape
│   │   │   ├── env.ts               # Zod-validated env, fail fast at boot
│   │   │   ├── db.ts                # Mongoose connection
│   │   │   └── tokens.ts            # JWT sign/verify, refresh rotation logic
│   │   └── app.ts / server.ts
│   └── tests/
│       ├── unit/                    # colocated *.spec.ts preferred; folder here for clarity
│       ├── integration/             # *.integration.spec.ts against test DB
│       └── e2e/                     # Playwright, critical flows only
│
├── MERN_Best_Practices_Checklist.md
├── SPEC.md
├── README.md
└── biome.json
```

---

## 4. Feature Scope (v1)

1. **Register** — email + password, hashed with bcrypt (cost factor 12), duplicate-email handled as `BusinessError`, not a raw 500.
2. **Login** — issues short-lived access token (15 min) + long-lived refresh token (7 days), refresh token stored hashed in DB (`RefreshToken` collection), never store raw refresh tokens.
3. **Refresh token rotation** — every refresh request issues a *new* refresh token and invalidates the old one. Reuse of an already-rotated token revokes the entire token family (theft detection).
4. **Logout** — revokes the current refresh token.
5. **Logout all devices** — revokes every refresh token for the user.
6. **RBAC middleware** — `authorize('admin')` / `authorize(['admin', 'editor'])` guards on protected routes; roles stored on the `User` model.
7. **Ownership/tenant scoping pattern** — example protected resource (`/api/notes`) demonstrating `scopedQuery()` so the boilerplate shows the pattern in action, not just auth in isolation.
8. **Password reset flow** — request reset (emails a signed, short-lived token — stub email sender for the OSS version), reset with token.
9. **Rate limiting** — on `/login` and `/register` to blunt brute force (e.g. `express-rate-limit`).
10. **Security headers** — `helmet`, CORS configured explicitly (not wildcard).

**Out of scope for v1** (note in README as "roadmap"): OAuth/social login, email verification on signup, 2FA/MFA — these are natural "good first issue" additions for people who clone it, which also encourages community contributions.

---

## 5. Data Models

**User**
```ts
{
  _id: ObjectId,
  email: string (unique, lowercase, indexed),
  passwordHash: string,
  role: 'user' | 'admin',
  createdAt: Date,
  updatedAt: Date,
}
```

**RefreshToken**
```ts
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  tokenHash: string,          // sha256 of the actual refresh token, never store raw
  familyId: string,           // groups rotated tokens for theft detection
  revoked: boolean,
  expiresAt: Date,
  createdAt: Date,
}
```

---

## 6. API Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Issue access + refresh token |
| POST | `/api/auth/refresh` | Refresh token (cookie or body) | Rotate tokens |
| POST | `/api/auth/logout` | Access token | Revoke current refresh token |
| POST | `/api/auth/logout-all` | Access token | Revoke all refresh tokens for user |
| POST | `/api/auth/forgot-password` | No | Send reset token (stubbed email) |
| POST | `/api/auth/reset-password` | Reset token | Set new password |
| GET | `/api/auth/me` | Access token | Current user profile |
| GET | `/api/notes` | Access token | Example scoped resource (demonstrates ownership pattern) |
| POST | `/api/notes` | Access token | Example scoped resource (create) |
| GET | `/api/admin/users` | Access token + `admin` role | Example RBAC-protected route |

All responses use the `ActionResult` shape: `{ success: boolean, data?: T, error?: { message: string, code?: string } }`.

---

## 7. Security Requirements

- Passwords hashed with bcrypt (or argon2id as an alternative — document tradeoff in README).
- Access tokens short-lived (15 min), refresh tokens long-lived (7 days) but rotated on every use.
- Refresh tokens stored **hashed** in the DB, compared via hash — a DB leak alone doesn't expose usable tokens.
- Refresh token reuse detection: if a rotated (already-used) token is presented again, revoke the whole token family and force re-login — this catches stolen-token replay.
- All input validated server-side with Zod even though the client also validates (defense in depth, per checklist item 3).
- Env vars validated once at boot (`lib/env.ts`), app crashes immediately with a clear message if misconfigured — no silent failures three requests later.
- `helmet` + explicit CORS origin allowlist, not `*`.
- Rate limiting on auth endpoints specifically.

---

## 8. Testing Plan

| Tier | Coverage |
|---|---|
| Unit | Token generation/verification logic, password hashing, Zod schemas, `ActionResult`/error helpers |
| Integration | Full register → login → refresh → logout flow against a real test MongoDB (in-memory via `mongodb-memory-server`) |
| E2E | One Playwright flow: register → login → access protected route → refresh → logout |

---

## 9. Milestones

1. Repo scaffold: folder structure, `biome.json`, `tsconfig.json`, env validation, DB connection, error classes, `ActionResult` helper.
2. Auth core: register, login, JWT issuing, password hashing.
3. Refresh token rotation + reuse detection.
4. RBAC middleware + example protected/admin route.
5. Ownership-scoping example resource (`/api/notes`).
6. Password reset flow.
7. Frontend: React + Vite app consuming the API (login/register forms, protected route wrapper, `AuthContext`).
8. Tests: unit → integration → one E2E flow.
9. README: architecture explanation (the "why," matching the checklist's teaching style), setup instructions, roadmap/good-first-issues section.
10. LinkedIn launch post.

---

## 10. Explicit Note on Origin

This boilerplate is built from `MERN_Best_Practices_Checklist.md` — a set of *generic, original* architectural principles. It is **not** derived from any client's proprietary codebase, naming conventions, or internal documentation. All code in this repo is original implementation.
