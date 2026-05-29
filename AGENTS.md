# Frontend — For Agents

Mission Control dashboard for the Jetson SAR Gateway. All UI lives under `src/components/dashboard/`.

---

## Project context

- **Code** is the SAR drone repo. See [Code/README.md](../README.md) for architecture (Frontend → Gateway → LLM → drone-http / model server).
- The frontend talks only to the **Gateway** over HTTP/WebSocket. Drone data is accessed via gateway proxies (`/drone/*`), not by calling drone-http directly.

---

## Routes

| Path | Layout | Purpose |
|------|--------|---------|
| `/` | `DashboardLayout` | Mission prompt, map, HUD, mission overview |
| `/mission` | `MissionLayout` | Mission planner + map |
| `/logs` | `FlightLogsLayout` | LLM history, flight events, Pixhawk MAVLink (WS) |

All dashboard components are `"use client"`.

---

## Folder structure

```
frontend/src/
├── app/
│   ├── layout.tsx, globals.css
│   ├── page.tsx
│   ├── mission/page.tsx
│   └── logs/page.tsx
├── components/
│   ├── dashboard/          # AppShell, navbar, sidebar, cards, FlightLogsLayout
│   └── types.ts            # ApiResponse, DroneTelemetry, log types
├── hooks/                  # telemetry, mission, logs stream, LLM logs, geolocation
├── lib/                    # gateway client, map, mission utils, formatters
└── types/drone.ts          # Telemetry, MissionLeg, Waypoint view types
```

---

## Data flow

1. **Telemetry**: `useDroneTelemetryWs` → `WS /drone/ws`; `useTelemetry` also polls `GET /drone/telemetry` every 5s. Mapped via `telemetryMap.ts`. Battery V/A/W shown in **navbar**.
2. **Mission**: `useMission` polls `GET /drone/mission` every 5s.
3. **Flight logs** (dedicated page): `useLogsStream` → `WS /drone/logs/ws` with HTTP fallback; `useLlmLogs` → `GET /logs/llm`.
4. **Prompt**: `MissionPromptCard` → `POST /infer` with `{"Infer": {"prompt": "..."}}`. Gateway **auto-applies** drone tools (no separate approval UI).

---

## Styling

- Dark theme (`--dash-*` in `globals.css`, Tailwind `dash` colors).
- `.dashboard-app` uses `white-space: nowrap` on text; scroll inside `.dash-scroll` panels.
- Maps: Leaflet in `LiveMapCard` (satellite + label overlay via `mapBasemap.ts`).

---

## Conventions

1. **Gateway URL**: `process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"` in `lib/gateway.ts`.
2. **Types**: Keep `components/types.ts` aligned with gateway and drone-http JSON.
3. **New UI**: Add under `components/dashboard/`; wire in the relevant layout.

See **gateway/AGENTS.md** for API shapes.
