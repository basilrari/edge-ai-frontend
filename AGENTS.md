# Frontend — For Agents

Mission Control dashboard for the Jetson SAR Gateway. All UI lives under `src/components/dashboard/`; there is no legacy operator UI.

---

## Project context

- **Code** is the SAR drone repo. See [Code/README.md](../README.md) for architecture (Frontend → Gateway → LLM → drone-http / model server).
- The frontend talks only to the **Gateway** over HTTP/WebSocket. Drone data is accessed via gateway proxies (`/drone/*`), not by calling drone-http directly.

---

## Folder structure

```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Renders <DashboardLayout />
│   └── globals.css           # Dashboard theme, Leaflet z-index fixes
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx   # Main grid, data hooks, infer handler
│   │   ├── DashboardNavbar.tsx   # Online status, link type, battery
│   │   ├── DashboardSidebar.tsx
│   │   ├── MissionPromptCard.tsx # POST /infer
│   │   ├── LiveMapCard.tsx       # Leaflet map + waypoints + drone marker
│   │   ├── TelemetryHUDCard.tsx
│   │   ├── MissionOverviewCard.tsx
│   │   ├── FlightLogsCard.tsx
│   │   ├── BottomStatusBar.tsx
│   │   └── DashboardCard.tsx
│   └── types.ts              # ApiResponse, DroneTelemetry, DroneMission, etc.
├── hooks/
│   ├── useTelemetry.ts       # WS + REST telemetry → HUD model
│   ├── useDroneTelemetryWs.ts
│   ├── useMission.ts
│   └── useFlightLogs.ts
├── lib/
│   ├── gateway.ts            # GATEWAY_URL, sendInferPrompt
│   ├── telemetryMap.ts       # DroneTelemetry → Telemetry HUD fields
│   ├── missionUtils.ts       # Mission legs + stats from waypoints
│   ├── format.ts             # Display formatters
│   └── constants.ts          # Brand, prompt placeholder, char limit
└── types/drone.ts            # Telemetry, MissionLeg, Waypoint view types
```

Single route: `/` → `DashboardLayout`. All dashboard components are `"use client"`.

---

## Data flow

1. **Telemetry**: `useDroneTelemetryWs` connects to `WS ${GATEWAY_URL}/drone/ws`; `useTelemetry` also polls `GET /drone/telemetry` every 5s as fallback. Mapped via `telemetryMap.ts`.
2. **Mission**: `useMission` polls `GET /drone/mission` every 5s → waypoints on map + Mission Overview legs.
3. **Flight logs**: `useFlightLogs` polls `GET /drone/logs` every 3s.
4. **Prompt**: `MissionPromptCard` → `sendInferPrompt()` → `POST /infer` with `{"Infer": {"prompt": "..."}}`. Success/error shown inline.

---

## HUD fields not on the MAVLink link yet

Documented in `telemetryMap.ts` (`TELEMETRY_NOT_FROM_DRONE`): battery, GPS sat count, distance from home, home coordinates, RC signal, gimbal/camera. These render as `—` until drone-http exposes them.

---

## Styling

- Dark theme only (`--dash-*` CSS variables in `globals.css`, Tailwind `dash` colors in `tailwind.config.ts`).
- Use `dashboard-panel`, `metric-tile`, `prompt-input`, `button.primary` — do not reintroduce legacy `.card` / `.badge` classes from the old UI.

---

## Conventions for agents

1. **Gateway URL**: `process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"` via `lib/gateway.ts`.
2. **Types**: Keep `components/types.ts` aligned with gateway and drone-http JSON.
3. **New UI**: Add components under `components/dashboard/`; wire data in `DashboardLayout.tsx`.
4. **Maps**: Use Leaflet in `LiveMapCard` (Carto Dark basemap); cap Leaflet z-index inside `.dashboard-panel`.

For gateway API shapes, see **gateway/AGENTS.md**.
