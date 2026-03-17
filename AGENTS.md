# Frontend — For Agents

This file describes the **frontend structure**, **conventions**, and **integration points** so agents can work on the Jetson SAR Gateway dashboard without guessing.

---

## Project context

- **Code** is the SAR (Search and Rescue) drone repo. See [Code/README.md](../README.md) for the full architecture (Frontend → Gateway → LLM → Drone Server / Model Server).
- The **frontend** is the operator’s main interface: text input for natural-language intent, quick actions for SAR model tools, and (planned) map for waypoint selection and mission control. It talks only to the **Gateway** (HTTP). The Gateway routes accepted commands to the **Drone Server** (drone-server/) or **Model Server** (python-worker / ROS2). Do not call drone-server or model server directly from the frontend.

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
    ├── ActiveCommandBar.tsx   # Drone + model cards from last applied only; proposal + Accept/Reject from latest
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

- **ApiResponse**: Matches POST `/infer` response — `state`, `model`, `override_active`, `category`, `tool_name`, `pending_approval`, `llm_response`, `action_taken`, `latency_ms`, `llm_latency_ms`.
- **StatusResponse**: Matches GET `/status` — `state`, `model`, `override_active`, `latency_ms`, `llm_latency_ms`, `memory_estimate_mb`. (Frontend does not use `active_command` from status; it derives “current command” from the last **accepted** response in `ActiveCommandBar`, not from status.)

History entries are `ApiResponse & { timestamp: string }` (ISO string), kept in state in `page.tsx` and capped at 10. Only one entry per outcome: added when Infer returns without `pending_approval`, or when the user Accepts (ApplyTool response); proposals are not added to avoid double entries.

---

## Data flow

1. **Status**: `page.tsx` polls `GET ${GATEWAY_URL}/status` every 10s and passes `status: StatusResponse | null` to `StatusCard`.
2. **Infer**: User submits via `PromptForm` or `QuickActions` → `page.tsx` calls `POST ${GATEWAY_URL}/infer` with `{"Infer": {"prompt": "..."}}` → response stored as `latest`. If `pending_approval: true`, the frontend does not update the "Current active command" cards or add to history; it shows "Proposed: &lt;tool&gt;" and Accept/Reject. If `pending_approval` is false, response is stored as `lastApplied`, cards update, and one entry is prepended to `history`.
3. **Active command (cards)**: `ActiveCommandBar` receives `confirmed` (`lastApplied`) and `latest`. The Drone and Model cards are driven only by `confirmed` (last response sent to server after Accept). They update only after Accept or when Infer returns without a tool. When there is a pending proposal, a line "Proposed: &lt;tool label&gt; — Approve to send to server" and Accept/Reject buttons are shown.
4. **Accept**: User clicks Accept → `POST /infer` with `{"ApplyTool": {"category", "tool_name"}}` → response stored as `latest` and `lastApplied`, one entry prepended to `history`.
5. **Reject**: User clicks Reject → `latest` is updated with `pending_approval: false`; cards and history unchanged.
6. **StatusCard** receives both `status` and `latest`; it shows gateway metrics and "last tool decision" (category, tool_name, action_taken) and parses `llm_response` as JSON for an optional LLM run summary (tokens, timings, etc.).

---

## API calls (from frontend)

- **GET /status**: No body. Returns `StatusResponse`. Used only for polling.
- **POST /infer**: Body `{"Infer": {"prompt": "<string>"}}` (returns proposal with optional `pending_approval: true`) or `{"ApplyTool": {"category": "<string>", "tool_name": "<string>"}}` (after user accepts). Returns `ApiResponse`. Override/ClearOverride are not used by the current UI (see `gateway/AGENTS.md`).

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
