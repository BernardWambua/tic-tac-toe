# Groq AI Setup (GitHub Pages + GitHub Secrets)

This project is static on GitHub Pages, so the Groq key must not be sent to the browser.
Use a proxy worker and keep secrets in GitHub repository secrets.

## 1) Add repository secrets

Add these in GitHub: Settings -> Secrets and variables -> Actions.

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `GROQ_PROXY_URL` (example: `https://tic-tac-groq-proxy.<subdomain>.workers.dev`)
- `GROQ_API_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 2) Deploy the AI proxy

Workflow: `.github/workflows/deploy-ai-proxy.yml`

This workflow:
- deploys `ai-proxy/worker.js` to Cloudflare Workers
- injects `GROQ_API_KEY` into the worker as a runtime secret

Run the workflow manually once (or push changes in `ai-proxy/**`).

## 3) Deploy the site

Workflow: `.github/workflows/deploy.yml`

This workflow generates:
- `firebase-config.js` from Firebase secrets
- `ai-config.js` from `GROQ_PROXY_URL`

Then it deploys the static site to GitHub Pages.

## Failure behavior

If Groq AI fails at runtime, the game does not silently fallback.
The user is explicitly told to start a new game and pick another mode (for example Minimax).
