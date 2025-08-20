# ARCH.md — The Living Sketchbook (Cloudflare-only)

## Project Overview
**The Living Sketchbook** is an interactive, black-and-white, sketchbook-styled 3D gallery. Every hour, community-voted characters come to life in the gallery. Visitors join instantly as Guests, may save identity with Passkeys, and can create, vote, and explore.

- **Frontend Hosting:** Cloudflare Pages (Next.js App Router, React + react-three-fiber).  
- **Backend APIs:** Cloudflare Pages Functions / Workers.  
- **Database:** Cloudflare D1 (SQLite).  
- **Storage:** Cloudflare R2 (images, vector strokes).  
- **Session/Rate State:** Cloudflare KV + Durable Objects.  
- **Realtime:** Durable Objects WebSockets (or Pub/Sub).  
- **Captcha:** Cloudflare Turnstile.  
- **Cron:** Cloudflare Cron Triggers (hourly).  
- **No Vercel usage** — GitHub auto-deploy to Cloudflare Pages only.

---

## Repo Structure
```
/app/                  # Next.js frontend
  /components/         # UI + 3D scene components
  /pages/              # Routing
/functions/            # Cloudflare Pages Functions (API endpoints)
/workers/              # Dedicated Workers (e.g., WebSockets)
/workers/do/           # Durable Object classes
/lib/                  # Shared code (db.ts, cookies.ts, rateLimit.ts, turnstile.ts)
/schema/               # D1 SQL migrations
/public/               # Static assets (textures, fonts, icons)
/scripts/              # Local scripts (dev/test helpers)
wrangler.toml
ARCH.md
README.md
```

---

## Cloudflare Bindings (fixed names)

**`wrangler.toml` must include:**
```toml
name = "living-sketchbook"
compatibility_date = "2025-08-01"

[pages]
# Cloudflare Pages project will use /functions

[[d1_databases]]
binding = "DB"
database_name = "sketchbook-db"
database_id = "XXXX"

[[r2_buckets]]
binding = "R2"
bucket_name = "sketchbook-assets"

[[kv_namespaces]]
binding = "KV_SESSIONS"
id = "XXXX"

[[durable_objects.bindings]]
name = "WorldHub"
class_name = "WorldHubDO"

[vars]
SESSION_COOKIE_NAME = "sb_session"

[triggers]
crons = ["59 * * * *"] # hourly resolution
```

Do not invent other bindings or names.

---

## Data Model (D1)

```sql
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  kind TEXT CHECK(kind IN ('guest','passkey')),
  alias TEXT,
  createdAt TEXT NOT NULL,
  banned INTEGER DEFAULT 0
);

CREATE TABLE Session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  lastSeenAt TEXT NOT NULL,
  ipHash TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id)
);

CREATE TABLE Submission (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  vectorJson TEXT,
  createdAt TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending','approved','rejected')) NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id)
);

CREATE TABLE Vote (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  submissionId TEXT NOT NULL,
  periodKey TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  ipHash TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id),
  FOREIGN KEY(submissionId) REFERENCES Submission(id),
  UNIQUE(userId, submissionId, periodKey)
);

CREATE TABLE Winner (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  periodKey TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  votesAtWin INTEGER NOT NULL,
  spawnX REAL,
  spawnY REAL,
  behavior TEXT CHECK(behavior IN ('walk','bounce','idle')) NOT NULL,
  FOREIGN KEY(submissionId) REFERENCES Submission(id)
);

CREATE TABLE Period (
  key TEXT PRIMARY KEY,
  startsAt TEXT NOT NULL,
  endsAt TEXT NOT NULL,
  resolvedAt TEXT,
  winnerSubmissionId TEXT,
  FOREIGN KEY(winnerSubmissionId) REFERENCES Submission(id)
);

CREATE TABLE PasskeyCredential (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  publicKey TEXT NOT NULL,
  credId TEXT NOT NULL,
  counter INTEGER,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id)
);

CREATE TABLE ModerationLog (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  adminId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(submissionId) REFERENCES Submission(id),
  FOREIGN KEY(adminId) REFERENCES User(id)
);
```

---

## Core Endpoints

- `POST /api/guest` → create guest + set signed cookie.  
- `POST /api/passkey/register`, `POST /api/passkey/verify` → WebAuthn.  
- `POST /api/submissions` → upload PNG+meta → R2.  
- `GET /api/submissions?sort=hot|new&page=n` → list.  
- `POST /api/votes` → cast vote (server computes `periodKey`).  
- `GET /api/periods/current` → leaderboard + countdown.  
- `POST /api/periods/resolve` → **cron-only** (HMAC required).  
- `GET /api/winners?cursor=n` → Hall of Fame feed.  
- `GET /api/world/state` → current live characters.  
- `WS /api/world/live` → join world; receive `spawn_winner` + `crowd_count`.  
- `POST /api/admin/moderate` → admin moderation.  

---

## World Renderer (Landing Page)

- Landing `/` = **3D gallery** using react-three-fiber.  
- Style: black-on-white sketch aesthetic, outline shader + paper overlay.  
- Movement: WASD + mouse (desktop), joystick (mobile).  
- Exhibits: frames on corridor walls; click → open info panel.  
- Winners spawn via WS event → sketch-reveal animation.  
- Fallback: `/world-2d` Canvas version.

---

## Game Loop

- One-hour periods (UTC).  
- Votes: max 30 votes/user/hour; one per submission/period.  
- At period end: Cron Worker → pick winner → broadcast to WS clients.  
- Tie-break: earliest submission.  
- Runner-ups: optional wall posters (24h).  

---

## Validation & Anti-Abuse
- Server validates PNG is strictly black/white, ≤500KB.  
- Rate-limiting: Durable Object token buckets; KV fallback.  
- Cloudflare Turnstile after bursts.  
- Admin review queue for all new submissions.

---

## Rules for All Code
1. Only use Cloudflare Pages/Workers. Never use Vercel or external server runtimes.  
2. Always use the binding names from `wrangler.toml`.  
3. Endpoints must live under `/functions/api/*` unless explicitly Worker/DO.  
4. DO class name = `WorldHubDO`. KV name = `KV_SESSIONS`. D1 binding = `DB`. R2 binding = `R2`.  
5. Every endpoint must have rate-limits + Turnstile when relevant.  
6. Cookies must be `Secure`, `HttpOnly`, `SameSite=Lax`.  
7. Time keys: `periodKey = YYYYMMDDHH` (UTC).  
8. Never invent new env vars — propose alternatives first.  
9. All images/textures must remain strictly black & white.  
10. All tasks must be implemented in small, atomic PRs with clear tests.

---

## Acceptance Criteria (MVP)
- Guest auto-entry on first visit.  
- Passkey "Save Profile" persists across devices.  
- Submissions validated (black/white, ≤500KB).  
- Voting locks per user/period, Turnstile after bursts.  
- Winner appears in 3D gallery within 2s of cron.  
- Hall of Fame archive works.  
- 3D gallery loads in <2.5s, a11y ≥90 Lighthouse.  
- Fallback `/world-2d` available.