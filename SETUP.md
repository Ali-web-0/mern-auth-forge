# Setup Guide (Simple Version)

A plain step-by-step guide to get this project running on your computer. For the full architecture explanation, see `README.md` — this file is just "how do I turn it on."

## What's in this project

A login/signup system (MERN stack) with things a real app needs: secure sessions, role-based access (admin vs regular user), password reset by email, and a small example page (Notes) that only the owner can see.

## Technologies used

**Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
**Backend:** Node.js, Express, TypeScript
**Database:** MongoDB (via Mongoose)
**Auth:** JWT tokens (access + refresh)
**Email:** Resend (optional — works without it too)
**Testing:** Vitest, Playwright

## Step 1 — Install requirements

- [Node.js](https://nodejs.org) version 24 or newer
- A MongoDB database — easiest is a free [MongoDB Atlas](https://www.mongodb.com/atlas) account (no local install needed)

## Step 2 — Download and install

```bash
git clone https://github.com/<your-username>/mern-auth-forge.git
cd mern-auth-forge
npm install
```

This installs everything for both the frontend and backend in one command.

## Step 3 — Create your database

1. Sign up free at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free cluster (the "M0 Free" tier).
3. On your cluster, click **Connect** → **Drivers and Client Libraries** → choose **Node.js**.
4. Copy the connection string it gives you — looks like `mongodb+srv://user:<password>@cluster0.xxxxx.mongodb.net/...`
5. Replace `<password>` with your actual database user password (set/reset it under **Database Access** in the sidebar if you don't know it).
6. Under **Network Access**, add your IP address (or `0.0.0.0/0` to allow from anywhere — fine for local dev).
7. Add a database name into the string, right after `.net/`:
   ```
   mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/mern-auth-forge?retryWrites=true&w=majority
   ```
   MongoDB creates this database automatically the first time you register a user — you don't need to create it manually.

## Step 4 — Configure the server

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in:

- `MONGODB_URI` → the connection string from Step 3
- `JWT_ACCESS_SECRET` → any random string, 32+ characters. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Everything else can stay as the default.

## Step 5 — Configure the client

```bash
cp client/.env.example client/.env
```

No changes needed — it already points at `http://localhost:4000/api`.

## Step 6 — (Optional) Set up real email

Without this step, "Forgot password" still works — it just logs the reset link to your server terminal instead of emailing it. That's fine for testing.

To send real emails:

1. Sign up free at [resend.com](https://resend.com).
2. Go to **API Keys** → **Add API Key** → copy the key.
3. Add to `server/.env`:
   ```
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=onboarding@resend.dev
   ```
4. Note: with an unverified domain, Resend only delivers to the email address your Resend account is signed up with. To send to any user, verify your own domain under **Domains** in Resend and change `EMAIL_FROM` to an address on it.

## Step 7 — Run the app

Open two terminals.

**Terminal 1:**
```bash
npm run dev:server
```
**Terminal 2:**
```bash
npm run dev:client
```

Then open **http://localhost:5173** in your browser.

## Step 8 — Try it out

- Register a new account.
- Log out, log back in.
- Add a note on the dashboard.
- Try "Forgot password."
- Refresh the page while logged in — you should stay logged in (this tests the automatic token refresh).

### Become an admin (optional)

1. In MongoDB Atlas, go to **Browse Collections** → `mern-auth-forge` database → `users` collection.
2. Open your user, change `"role": "user"` to `"role": "admin"`, save.
3. Log out and log back in in the app (roles are baked into the login token, so you need a fresh one).
4. An "Admin panel" button now appears on your dashboard.

## Best practices this project follows (in plain terms)

- **Passwords are never stored as plain text** — only a one-way hash.
- **Login sessions expire quickly** (15 minutes) and refresh automatically behind the scenes, so you don't have to log in constantly, but a stolen token doesn't stay valid for long.
- **If a stolen session token is reused, every device gets logged out automatically** — the app can tell when a token is being replayed.
- **Users can only see their own data.** This is enforced in the database query itself, not just hidden in the interface — so it can't be bypassed.
- **Every input is checked twice** — once in the browser (for instant feedback) and again on the server (because the browser can never be trusted).
- **No secrets are stored in the code.** Passwords, database URLs, and API keys live only in your local `.env` files, which are excluded from Git.
- **The app refuses to start if misconfigured**, with a clear error message — instead of behaving strangely later.
- **Automated tests check these rules actually hold**, not just that the code runs. See `npm run test:server:unit` and `npm run test:server:int`.

## Troubleshooting

- **Server crashes immediately on start** → almost always a bad `MONGODB_URI` or a `JWT_ACCESS_SECRET` shorter than 32 characters in `server/.env`.
- **Can't connect to MongoDB** → check Network Access in Atlas — your current IP (or `0.0.0.0/0`) needs to be allowed.
- **Password reset email never arrives** → check your server terminal for the logged link, or confirm you're testing with the email your Resend account is registered under (sandbox mode restriction — see Step 6).
- **Weird TypeScript errors in an editor** → run `npm install` again to make sure all packages are up to date.
