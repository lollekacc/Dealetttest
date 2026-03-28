# Dealett – Full-stack Refactor

This repository has been refactored into a clean full-stack architecture with separate frontend and backend applications while preserving existing user-facing pages and flows.

## New architecture

```text
/
├── frontend/                 # React + Vite + Tailwind UI app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   └── public/legacy/        # Migrated legacy UI pages/assets (kept working)
├── backend/                  # Express API app
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       ├── config/
│       └── data/
└── package.json              # Workspace scripts
```

## What was changed

- **UI code moved into `/frontend`**:
  - React + Vite + Tailwind app added in `frontend/src`.
  - Existing HTML/CSS/JS/images/partials/data moved to `frontend/public/legacy` to keep current functionality available.
- **API logic moved into `/backend`**:
  - Added Express backend with clear route/controller/service/middleware layers.
  - Added API endpoints:
    - `GET /api/health`
    - `GET /api/plans`
    - `POST /api/chat`
  - Plans are now served from backend data instead of direct frontend file access.
  - Chat requests are proxied through backend service.
- **Environment variable support added**:
  - `frontend/.env.example` with `VITE_API_BASE_URL`.
  - `backend/.env.example` with `PORT`, `FRONTEND_ORIGIN`, `CHAT_PROXY_URL`, and `NODE_ENV`.

## Run locally

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3) Workspace (from repo root)

```bash
npm install
npm run dev
```

> Note: In this execution environment, package installation from npm registry may be restricted by policy.

## API contract (backend)

### `GET /api/plans`
Returns the plans array used by offer pages.

### `POST /api/chat`
Body:

```json
{ "message": "..." }
```

Forwards chat message to configured upstream (`CHAT_PROXY_URL`) and returns provider response.

## Legacy compatibility notes

To keep existing features working:

- Legacy pages and static assets were preserved under `frontend/public/legacy`.
- Legacy scripts that previously fetched `./data/plans.json` now call `GET /api/plans`.
- Legacy chat script that called the old remote endpoint now calls `POST /api/chat`.

## Created, moved, and modified files

### Created

- `.gitignore`
- `README.md`
- Root workspace package:
  - `package.json` (workspace scripts)
- **Frontend app files**:
  - `frontend/package.json`
  - `frontend/index.html`
  - `frontend/.env.example`
  - `frontend/vite.config.js`
  - `frontend/tailwind.config.js`
  - `frontend/postcss.config.js`
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/index.css`
  - `frontend/src/components/TopBar.jsx`
  - `frontend/src/components/LegacyPageCard.jsx`
  - `frontend/src/hooks/useBackendHealth.js`
- **Backend app files**:
  - `backend/.env.example`
  - `backend/src/server.js`
  - `backend/src/app.js`
  - `backend/src/config/env.js`
  - `backend/src/routes/health.routes.js`
  - `backend/src/routes/plans.routes.js`
  - `backend/src/routes/chat.routes.js`
  - `backend/src/controllers/health.controller.js`
  - `backend/src/controllers/plans.controller.js`
  - `backend/src/controllers/chat.controller.js`
  - `backend/src/services/plans.service.js`
  - `backend/src/services/chat.service.js`
  - `backend/src/middleware/request-logger.middleware.js`
  - `backend/src/middleware/not-found.middleware.js`
  - `backend/src/middleware/error-handler.middleware.js`
  - `backend/src/data/plans.json`

### Moved

- `assets/` → `frontend/public/legacy/assets/`
- `images/` → `frontend/public/legacy/images/`
- `partials/` → `frontend/public/legacy/partials/`
- `data/` → `frontend/public/legacy/data/`
- `account.js` → `frontend/public/legacy/account.js`
- `package-lock.json` → `backend/package-lock.json`
- `package.json` (old backend file) → replaced and maintained at `backend/package.json`
- All root-level html pages moved to `frontend/public/legacy/`:
  - `<!DOCTYPE html>.html`
  - `abonnemang.html`
  - `account.html`
  - `belöning.html`
  - `bredband.html`
  - `företag.html`
  - `index.html`
  - `jamfor.html`
  - `kundservice.html`
  - `login.html`
  - `om-oss.html`
  - `partner.html`
  - `signera.html`
  - `test.html`
  - `varukorg.html`

### Modified

- `frontend/public/legacy/assets/offers.js` (plans source moved to backend API)
- `frontend/public/legacy/assets/front.js` (plans source moved to backend API)
- `frontend/public/legacy/assets/chat.js` (chat source moved to backend API)
- `backend/package.json` (updated backend dependencies/scripts)
- `package.json` (converted root to workspace orchestration)

