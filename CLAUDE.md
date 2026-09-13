# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

A single-screen morning dashboard for a Finnish family (calendars, weather/UV, bus departures, waste collection), shown on a tablet at home. It is deliberately not exposed to the public internet — see "Security model" below. Full background lives in `docs/requirements.md` and `docs/plan.md` (both gitignored — local planning docs, not part of the repo history).

## Repo layout

Two independent npm projects, no root package.json/workspace tooling — install and run each separately:

- `backend/` — Node/Express API (CommonJS)
- `frontend/` — React + Vite app (currently still close to the default Vite scaffold; the API-consuming pages/panels described in `docs/plan.md` are not built yet)

## Commands

Backend (from `backend/`):
- `npm install`
- `npm start` — runs `node server.js`, listens on `PORT` from `.env` (default 3001)
- First run needs `backend/.env` (copy `.env.example`) with `DIGITRANSIT_API_KEY` set, or `/api/buses` will fail
- If `backend/data/config.json` is missing, `server.js` auto-creates it from `data/config.example.json` on startup — real calendar URLs/waste dates still need to be filled in afterward (via `PUT /api/config` or by hand)

Frontend (from `frontend/`):
- `npm install`
- `npm run dev` — Vite dev server
- `npm run build`
- `npm run lint` — ESLint
- `npm run preview`

There is no test suite anywhere in this project (see `docs/tasks.md`); verification is manual (`npm start` + `npm run dev` and check each panel/endpoint against real data).

## Backend architecture

`server.js` wires five routers under `/api/*`, each in `routes/`: `weather`, `buses`, `calendar`, `waste`, `config`. Every route follows the same shape:

1. `readConfigOrFail(res)` (`lib/routeHelpers.js`) reads `data/config.json`, or sends a 500 and returns `null` — callers must `return` immediately when that happens.
2. Route-specific logic pulls whatever it needs out of config (`location`, `destination`, `calendars`, `waste`), calls an external API if applicable, and **reshapes the raw response into a small, frontend-friendly JSON shape**. Raw upstream payloads (Digitransit GraphQL edges, node-ical VEVENTs, Open-Meteo hourly arrays) never pass through as-is.
3. Results are cached per-route via `lib/cache.js`'s `createCache(ttlMs)` (a plain `Map` with expiry), keyed by whatever varies the response (e.g. lat/lon, or the joined owner+URL list for calendars). TTLs differ by how often the underlying data actually changes: weather 15 min, buses 1 min, calendar 7 min. `waste` has no external call or cache — it's derived directly from config.

Config persistence (`lib/configStore.js`) keeps a module-level in-memory copy of `config.json`, invalidated/replaced on every `writeConfig()` call — so reads after a `PUT /api/config` see the update without re-reading disk. `GET /api/config` and `PUT /api/config` are the only place config changes; `PUT` does manual shape validation (see `routes/config.js`) before writing.

Calendar fetching (`routes/calendar.js`) fetches each configured owner's iCal URL independently via `Promise.allSettled`, so one broken/unreachable calendar doesn't take down the whole endpoint — errors are collected per-owner and returned alongside whatever events did parse.

All timestamps returned to the frontend are formatted in `Europe/Helsinki` regardless of server locale, via `lib/time.js` (`toHelsinkiIsoString` / `toHelsinkiDateString`) — this matters because the family, the waste schedule, and calendar events are all Finland-local, but the host (e.g. a Raspberry Pi) may not be.

## Security model (why some things look "unlocked")

Per `docs/plan.md`, access control is entirely at the network layer: the backend is only ever reachable over a private Tailscale mesh (Pi + tablet + dev machine), never the public internet. There is intentionally no auth/login inside the app. This is why:

- `GET /api/config` returns the full config object unredacted (calendar iCal URLs, coordinates) — it's only ever called from the trusted local frontend.
- Secrets (`DIGITRANSIT_API_KEY`, the two iCal URLs) live in `backend/.env` / `backend/data/config.json` (both gitignored) and are only ever used server-side to fetch upstream data — routes must keep reshaping responses so raw secrets/URLs never leak into a JSON response sent to the frontend.

## Config shape

`backend/data/config.example.json` is the checked-in template; `backend/data/config.json` is the real, gitignored instance. Shape: `{ location: {lat, lon, name}, destination: {lat, lon, name}, calendars: {mom, dad}, waste: [{type, dates: [...]}] }`. `location` is the family's coordinates (used by weather + as the bus-journey origin); `destination` is the bus-journey endpoint.
