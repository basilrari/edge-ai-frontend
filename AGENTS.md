# Frontend — For Agents

This file describes the **frontend structure**, **conventions**, and **integration points** so agents can work on the Jetson SAR Gateway dashboard without guessing.

---

## Base context

- **Repo**: Frontend lives in `frontend/`; gateway (Rust API) lives in `gateway/`.
- **Gateway base URL**: From `NEXT_PUBLIC_GATEWAY_URL` (default `http://localhost:3000`). All API calls use this.
- **API contract**: Exact request/response shapes are in `gateway/AGENTS.md`. This file focuses on how the frontend uses them.

---

## Folder structure

```
frontend/src/
├── app/
│   ├── layout.tsx   # Root layout, metadata, viewport, dark class, globals.css
│   ├── page.tsx     # Single dashboard page: state, status poll, infer, layout
│   └── globals.css  # Tailwind + custom classes (see Styling below)
└── components/
    ├── types.ts              # ApiResponse, StatusResponse (matches gateway JSON)
    ├── ActiveCommandBar.tsx   # Shows current drone + model command from latest infer
    ├── StatusCard.tsx         # Gateway status, metrics, last tool decision, LLM summary
    ├── HistoryTable.tsx       # Last 10 inferences (HistoryEntry = ApiResponse + timestamp)
    ├── PromptForm.tsx        # Textarea + Send; calls onSend(prompt)
    ├── QuickActions.tsx       # Buttons that call onSelect(prompt) for SAR model tools
    └── ToolsPanel.tsx         # Static list of model + drone tools (no API)
```

- **Single page**: All UI is in `app/page.tsx`; no other routes.
- **Client components**: `page.tsx` and all components under `components/` are `"use client"` (they use state, effects, event handlers).

---

## Types (`components/types.ts`)

- **ApiResponse**: Matches POST `/infer` response — `state`, `model`, `override_active`, `category`, `tool_name`, `llm_response`, `action_taken`, `latency_ms`, `llm_latency_ms`.
- **StatusResponse**: Matches GET `/status` — `state`, `model`, `override_active`, `latency_ms`, `llm_latency_ms`, `memory_estimate_mb`. (Frontend does not use `active_command` from status; it derives “current command” from the latest infer response in `ActiveCommandBar`.)

History entries are `ApiResponse & { timestamp: string }` (ISO string), kept in state in `page.tsx` and capped at 10.

---

## Data flow

1. **Status**: `page.tsx` polls `GET ${GATEWAY_URL}/status` every 10s and passes `status: StatusResponse | null` to `StatusCard`.
2. **Infer**: User submits via `PromptForm` or `QuickActions` → `page.tsx` calls `POST ${GATEWAY_URL}/infer` with `{"Infer": {"prompt": "..."}}` → response stored as `latest`, and prepended to `history` (max 10).
3. **Active command**: `ActiveCommandBar` receives `latest: ApiResponse | null`. When `category === "none"` (e.g. ambiguous request), both Drone and Model slots show inactive/default labels and a line “No tool selected — &lt;reason&gt;” (reason from `tool_name`, e.g. “Ambiguous request”). Otherwise it derives drone vs model from `tool_name` using `MODEL_TOOL_LABELS` and `DRONE_TOOL_LABELS`.
4. **StatusCard** receives both `status` and `latest`; it shows gateway metrics and “last tool decision” (category, tool_name, action_taken) and parses `llm_response` as JSON for an optional LLM run summary (tokens, timings, etc.).

---

## API calls (from frontend)

- **GET /status**: No body. Returns `StatusResponse`. Used only for polling.
- **POST /infer**: Body `{"Infer": {"prompt": "<string>"}}`. Returns `ApiResponse`. Override/ClearOverride are not used by the current UI; they could be added (see `gateway/AGENTS.md` for body shapes).

All requests are `fetch()` from the client; no Next API routes. CORS is enabled on the gateway for all origins.

---

## Tool names (display)

- **Model tools** (SAR perception): `activate_human_detection_yolo`, `activate_flood_segmentation`, `activate_human_behaviour_analysis`, `share_with_swarm`, `activate_flood_classification`. Mapped to short labels in `ActiveCommandBar` and listed in `ToolsPanel` and `QuickActions`.
- **Drone tools** (not yet wired): `move_forward`, `hover`, `return_to_home`, `land_immediately`, `circle_search`. Listed in `ToolsPanel`; labels in `ActiveCommandBar`.

Adding a new tool: add label in `ActiveCommandBar` (and optionally a quick prompt in `QuickActions` and a row in `ToolsPanel`), and ensure the gateway returns that `tool_name` from `/infer`.

- **Category "none"**: When the gateway returns `category: "none"` (e.g. `tool_name: "ambiguous_request"`), the UI treats it as no tool selected; gateway state may be IDLE. Add human-readable labels in `ActiveCommandBar`’s `NONE_REASON_LABELS` if needed.

---

## Styling (Tailwind + globals.css)

- **Theme**: Dark only. `globals.css` sets `color-scheme: dark`; `layout.tsx` uses `className="dark"` on `<html>`.
- **Custom classes** (in `globals.css`):
  - `.card` — rounded card with border, slate/cyan, backdrop blur.
  - `.badge` — small pill; `.badge-active` — green, pulsed (for ACTIVE state).
  - `button.primary` — emerald submit button; `button.outline` — outline secondary.
  - `textarea.prompt-input` — main prompt input.
  - `code.llm-response` — raw LLM response block.
- **Safe area**: `.safe-area-padding` for notches/home indicator on mobile.
- **Layout**: Responsive grid; on small screens tools panel is below history; on md+ it’s in the sidebar next to `StatusCard`.

Use existing utility classes and these custom classes for consistency; avoid introducing new one-off global classes unless needed.

---

## Conventions for agents

1. **Gateway URL**: Always use `process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"` (or a single `useMemo`/constant in `page.tsx`) so env can override.
2. **Types**: Keep `ApiResponse` and `StatusResponse` in `components/types.ts` aligned with gateway JSON (see `gateway/AGENTS.md`). Add new fields there when the API gains them.
3. **New components**: Place in `src/components/`, use `"use client"` if they use hooks or events; receive data via props from `page.tsx`.
4. **New API actions**: Override/ClearOverride are not in the UI yet; add buttons or controls that POST `{"Override": {...}}` or `{"ClearOverride": null}` and then refresh status or latest as needed.
5. **Errors**: Infer errors are stored in `page.tsx` state and passed to `PromptForm`; display as non-blocking (e.g. inline message). Status poll errors are only logged.
6. **History**: Kept in React state (last 10); no persistence. Changing that would require a backend or local storage and a small refactor in `page.tsx`.

For the **exact** gateway request/response shapes and server behavior, always refer to **gateway/AGENTS.md**.
