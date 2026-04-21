# Tic-Tac-Toe

A web-based Tic-Tac-Toe game with local play, online multiplayer using Firebase, and AI play modes.

## Features

- Interactive 3x3 board with win highlighting
- Turn-aware scoreboard with player names and draw tracking
- Speech synthesis callouts for game events
- Multiple game modes from a single mode selector
- Firebase Authentication + Firestore-backed realtime online play
- AI play with separate mode choices:
  - Local deterministic Minimax AI
  - Groq API-backed AI through a secure proxy

## Game Modes

### 1) Local Multiplayer

Two people play on the same device.

- No account required
- Custom player names for X and O
- Scoreboard persists across rounds until New Game

### 2) Computer (Minimax)

You (X) play against local Minimax AI (O).

- No internet required
- Fully local and deterministic move calculation
- Good fallback mode when API-based AI is unavailable

### 3) Groq AI

You (X) play against Groq-powered AI (O) via a proxy endpoint.

- Requires network access and valid deployment config
- Uses `window.aiConfig.apiBaseUrl` generated during deployment
- If Groq fails at runtime, the app explicitly asks the user to switch modes
- No silent fallback to Minimax in this mode

### 4) Online Multiplayer

Realtime room-based play over Firebase.

- Email/password authentication
- Create room code or join by code
- Shared board/turn/scores synced via Firestore snapshots

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Online mode backend: Firebase Auth + Firestore
- AI proxy: Cloudflare Worker
- CI/CD and config generation: GitHub Actions
- Hosting: GitHub Pages (static frontend)

## Project Structure

- `index.html` - UI screens and layout
- `style.css` - game styling and responsive layout
- `game.js` - mode flow, board logic, online sync, and AI client calls
- `.github/workflows/deploy.yml` - GitHub Pages deployment and config generation
- `.github/workflows/deploy-ai-proxy.yml` - Cloudflare Worker deploy for Groq proxy
- `ai-proxy/worker.js` - Groq request proxy endpoint (`/move`)
- `ai-proxy/wrangler.toml` - Cloudflare Worker config
- `AI_SETUP.md` - focused setup guide for Groq proxy + secrets

## Required GitHub Secrets

For frontend deploy (`deploy.yml`):

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `GROQ_PROXY_URL`

For Groq proxy deploy (`deploy-ai-proxy.yml`):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `GROQ_API_KEY`

## Deployment Flow

1. Push code to `main`.
2. Run `Deploy Groq AI Proxy` workflow.
3. Copy the deployed Worker URL (`https://...workers.dev`) and store it as `GROQ_PROXY_URL`.
4. Run/push for `Deploy to GitHub Pages` workflow.
5. Open the site and verify the Groq AI mode is enabled.

## Local Development Notes

- This repository is designed for static hosting, so API keys must never be placed in frontend files.
- `firebase-config.js` and `ai-config.js` are generated from secrets during deployment.
- Example files are provided for reference:
  - `firebase-config.example.js`
  - `ai-config.example.js`
