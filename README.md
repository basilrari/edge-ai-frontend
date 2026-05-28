# Jetson SAR Gateway — Frontend

Next.js **Mission Control** dashboard for the Jetson LLM Gateway: live drone telemetry, mission overview, flight logs, and natural-language mission prompts.

## How this ties into the project

This frontend is the operator UI for the [SAR drone system](../README.md). Prompts go to the **Gateway** (`gateway/`), which runs the LLM and applies drone tools via **drone-http** (`drone-server/`). Live telemetry, mission, and logs are proxied at `GET/WS /drone/*` on the gateway.

## Overview

- **Stack**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet, Lucide React
- **Backend**: Gateway at `NEXT_PUBLIC_GATEWAY_URL` (default `http://localhost:3000`)
- **Features**: Live map, HUD telemetry, mission waypoints, drone flight logs, send prompt to drone via `/infer`

## Setup

```bash
npm install
```

Optional `.env.local`:

```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
```

Run the [gateway](../gateway/) and [drone-http](../drone-server/) stack before using the dashboard.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (use `-p 3001` if gateway uses 3000) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## Project structure

```
frontend/src/
├── app/
│   ├── layout.tsx       # Root layout, dark theme
│   ├── page.tsx         # Mission Control dashboard entry
│   └── globals.css      # Dashboard theme + Leaflet overrides
├── components/
│   ├── dashboard/       # Mission Control UI (layout, cards, map)
│   └── types.ts         # Gateway + drone API types
├── hooks/               # Telemetry, mission, flight logs, WebSocket
├── lib/                 # Gateway client, telemetry mapping, constants
└── types/drone.ts       # Dashboard view models
```

## API usage

| Endpoint | Purpose |
|----------|---------|
| `WS /drone/ws` | Live telemetry stream |
| `GET /drone/telemetry` | Telemetry REST fallback |
| `GET /drone/mission` | Uploaded mission waypoints |
| `GET /drone/logs` | Drone event log |
| `POST /infer` | Send natural-language mission prompt |

See **AGENTS.md** in this folder for agent-oriented details.
