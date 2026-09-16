# Family Dashboard

A single-screen morning dashboard for a family: calendars, weather/UV, bus departures, and waste collection, shown on a shared tablet at home.

Not exposed to the public internet — see [Security model](#security-model).

## Repo layout

Two independent npm projects, no root package.json/workspace tooling — install and run each separately:

- `backend/` — Node/Express API (CommonJS)
- `frontend/` — React + Vite app

## Prerequisites

- Node.js (a current LTS version) and npm
- A free [Digitransit API key](https://digitransit.fi/en/developers/api-registration/) (needed for the bus departures panel)
- Each parent's Google Calendar private iCal URL (Calendar settings → "Integrate calendar" → Secret address in iCal format)

## Setup

### Backend

```
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set `DIGITRANSIT_API_KEY` to your registered key. `PORT` defaults to `3001`.

```
npm start
```

On first run, if `backend/data/config.json` doesn't exist yet, it's auto-created from `backend/data/config.example.json`. Real calendar URLs, waste collection data, and location/destination coordinates still need to be filled in afterward — either by hand in `backend/data/config.json`, or via the Settings page in the running app (`PUT /api/config`).

### Frontend

```
cd frontend
npm install
npm run dev
```

The dev server proxies `/api` requests to the backend, so run the backend first (or alongside).

## Available scripts

Backend (from `backend/`):

- `npm install`
- `npm start` — runs `node server.js`

Frontend (from `frontend/`):

- `npm install`
- `npm run dev` — Vite dev server
- `npm run build` — production build to `frontend/dist`
- `npm run lint` — ESLint
- `npm run preview` — preview the production build locally

There is no automated test suite — verification is manual: run the backend and frontend, and check each panel/endpoint against real data.

## Config shape

`backend/data/config.example.json` is the checked-in template; `backend/data/config.json` is the real, gitignored instance actually used at runtime. It holds:

- `location` — the family's coordinates (used for weather and as the bus-journey origin)
- `destination` — the bus-journey endpoint
- `calendars` — a list of `{ id, name, url }` calendar feeds (any number, freely named); each gets an auto-assigned display color based on its position in the list
- `waste` / `wasteIntervals` — waste collection tracking (last emptied date per type, and the collection interval in days per type)

`backend/data/config.json` and `backend/.env` are both gitignored — they hold real secrets (iCal URLs, API key) and are never committed.

## Security model

There is intentionally no login/auth inside the app. Access control is meant to happen entirely at the network layer — the backend should only ever be reachable from trusted devices on a private network, never the public internet. Because of this, `GET /api/config` returns the full config object unredacted (calendar iCal URLs, coordinates) and is only safe to call from a trusted local frontend.

**This means the app must not be deployed anywhere reachable from the public internet as-is.**

## Deployment

TBD — to be written up once everything is confirmed working end-to-end locally.
