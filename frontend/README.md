# DLens Frontend

React/Vite frontend for the DLens data profiling, data shifting, and KDE dashboards.

## What This App Talks To

The frontend expects the FastAPI backend to be running separately. By default it calls:

```env
VITE_API_URL=http://127.0.0.1:8000
```

The backend currently supports these user-facing source flows:

- CSV upload
- MySQL source setup
- Postgres source setup

Other connectors are shown as disabled placeholders in the source picker until the backend implements them.

## Setup

Install dependencies from the `frontend` folder:

```powershell
cd frontend
npm install
```

Create or update `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the dev server:

```powershell
npm run dev
```

The app normally runs at:

```text
http://localhost:5173
```

You can also start backend and frontend together from the repository root:

```powershell
.\start_dev.bat
```

## Important Routes

- `/` - landing page
- `/Login` - login page
- `/Register` - registration page
- `/Source` - source connector picker
- `/csv`, `/excel`, `/csvDashboard` - CSV upload screen
- `/Connections` - pipeline launch and WebSocket progress
- `/DataProfiling` - profiling dashboard
- `/DataShifting` - shifting dashboard
- `/KDEDashboard` - KDE dashboard

## Frontend Structure

```text
src/
  api/                 Backend endpoint wrappers
  config/              Route and connector metadata
  Services/            Axios instance, interceptors, runtime URL helpers
  Redux/               Redux slices and store
  Components/
    CommonComponents/  Shared layout, cards, charts, sidebar, header
    Pages/             Route-level page components
  assets/              Icons and images
```

## Backend Integration Notes

Use `src/api/backend.js` for new backend calls instead of calling `Services.GET/POST/PUT` directly from page components. This keeps endpoint paths in one place.

Use `src/config/routes.js` for route paths. Avoid hardcoding route strings in new components when a constant already exists.

Use `src/config/connectors.jsx` when adding or enabling connectors. Set `supported: true` only when the backend can actually accept and process that connector.

WebSocket URLs are derived from `VITE_API_URL` through `makeWebSocketUrl`, so the app works whether the backend is configured as `localhost`, `127.0.0.1`, or HTTPS/WSS.

## Auth Mode

The backend may run with `AUTH_BYPASS=true` during local development. The frontend still supports the normal login and token-refresh flow, but protected routes are currently not wrapped by `PrivateRoute` so development can continue while auth is bypassed.

## Quality Checks

Build the production bundle:

```powershell
npm run build
```

Run lint:

```powershell
npm run lint
```

The app is still carrying some legacy dashboard code and large SVG/image assets. If the production build warns about large chunks, prefer lazy-loading new route-level pages and avoid adding more assets to the main route bundle.
