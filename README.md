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

Deployed on a free-tier Oracle Cloud VM (Ubuntu 22.04, shape `VM.Standard.E2.1.Micro`), reachable only via Tailscale — see [Security model](#security-model).

### One-time VM setup

1. Create the instance on a **public subnet** with a public IPv4 address assigned (needed for initial SSH access only — the app itself is never exposed publicly). Download the generated SSH key pair.
2. SSH in: `ssh -i /path/to/key.key ubuntu@<public-ip>`
3. Update packages and install a current Node.js LTS (e.g. via the NodeSource setup script); confirm with `node -v`.
4. Install Tailscale: `curl -fsSL https://tailscale.com/install.sh | sh`, then `sudo tailscale up` and sign in with the same Tailscale account used on every other device (tablet, dev laptop). Note the VM's Tailscale IP (`100.x.x.x`) from the [Tailscale admin console](https://login.tailscale.com/admin/machines) — that's the address used to reach the dashboard, not the public IP.

### Deploy / redeploy the app

```
git clone https://github.com/vmneva/family-dashboard.git
cd family-dashboard

cd backend
npm install
cp .env.example .env   # first deploy only — then edit DIGITRANSIT_API_KEY

cd ../frontend
npm install
npm run build
```

On first deploy, fill in `backend/data/config.json` (or use the Settings page once the app is running) with real calendar URLs, waste schedule, and coordinates.

For subsequent redeploys, `git pull` instead of `git clone`, then re-run `npm install`/`npm run build` as needed and restart the service (below).

### Run as a systemd service

Create `/etc/systemd/system/family-dashboard.service`:

```ini
[Unit]
Description=Family Dashboard backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/family-dashboard/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`NODE_ENV=production` is required — it's what makes `server.js` serve the built frontend (`frontend/dist`) and its `/` fallback route; without it, requests to `/` return "Cannot GET /" even though `/api/*` routes work. `ExecStart` assumes `node` is at `/usr/bin/node` — check with `which node` and adjust if the NodeSource install put it elsewhere.

```
sudo systemctl daemon-reload
sudo systemctl enable --now family-dashboard
sudo systemctl status family-dashboard   # should show active (running)
```

After a redeploy, restart the service to pick up changes:

```
sudo systemctl restart family-dashboard
```

### Access

Once running, the dashboard is reachable at `http://<vm-tailscale-ip>:3001` from any device signed into the same Tailscale account. The VM's public IP is never used for app access — the default Oracle security list blocks all inbound traffic except SSH.
