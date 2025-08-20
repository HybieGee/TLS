# The Living Sketchbook

An interactive, black-and-white, sketchbook-styled 3D gallery where community-voted characters come to life every hour.

## 🎨 Built with Cloudflare

- **Frontend**: Next.js + React + react-three-fiber
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Sessions**: Cloudflare KV + Durable Objects
- **Real-time**: Durable Objects WebSockets
- **Security**: Cloudflare Turnstile
- **Cron**: Cloudflare Cron Triggers

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for Cloudflare Pages
npm run build
```

## 🏗️ Architecture

See [ARCH.md](./ARCH.md) for detailed architecture documentation.

## 📁 Project Structure

```
/app/                  # Next.js frontend
  /components/         # UI + 3D scene components
/functions/            # Cloudflare Pages Functions (API endpoints)
/workers/              # Dedicated Workers (WebSockets, etc.)
/lib/                  # Shared utilities
/schema/               # D1 database migrations
/public/               # Static assets
```

## 🎯 Game Loop

1. **Create** - Users draw black & white characters
2. **Vote** - Community votes every hour
3. **Spawn** - Winners come to life in the 3D gallery
4. **Explore** - Walk through the living gallery (WASD + mouse)

## 🔒 Authentication

- **Guest Mode**: Automatic entry, session-based
- **Passkey**: Optional WebAuthn for persistent identity

## ⚡ Features

- [x] 3D Gallery with react-three-fiber
- [x] Responsive UI with Tailwind CSS  
- [x] Cloudflare Pages deployment ready
- [ ] Drawing canvas
- [ ] Voting system
- [ ] Character animation
- [ ] WebSocket real-time updates
- [ ] Passkey authentication
- [ ] Admin moderation

## 🌐 Live Demo

Deploying to Cloudflare Pages via GitHub integration.