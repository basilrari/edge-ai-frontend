# Jetson SAR Gateway — Frontend

Next.js dashboard for the **Jetson LLM Gateway**: mission control for search-and-rescue drone intelligence. Send natural-language prompts, view gateway status, and see the current active drone/model command and inference history.

## How this ties into the project

This frontend is the **operator UI** for the [SAR drone system](../README.md). The user types intent (e.g. “detect humans”, “return to home”, “circle this area”) in the text box; the frontend sends that to the **Gateway** (`gateway/`). The Gateway calls the **LLM** and returns a proposed **drone** or **model** tool; the user Accepts or Rejects. Accepted **model** tools are sent to the **Model Server** (flood segmentation, flood classification, human detection); accepted **drone** tools will be sent to the **Drone Server** (`drone-server/`) once that integration is wired. Map-based waypoint selection and mission/override controls are planned. See the root [README](../README.md) for the full architecture.

## Overview

- **Stack**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Talks to the gateway at `NEXT_PUBLIC_GATEWAY_URL` (default `http://localhost:3000`)
- **Features**: Status polling, prompt form, quick actions (SAR model tools), history table (last 10 inferences), tools panel, active command bar (drone + model). LLM tool proposals are shown with **Accept** / **Reject**; only accepted tools update the active command and are sent to the server; history has one entry per outcome (no double entry for propose then accept).

## Setup

```bash
npm install
```

Create a `.env` (or `.env.local`) if you need to override the gateway URL:

```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
```

Ensure the [gateway](../gateway/) server is running on that URL (e.g. `cargo run` in `gateway/`).

## Scripts

| Command   | Description                |
|----------|----------------------------|
| `npm run dev`   | Start dev server (default port 3000; use another port if gateway uses 3000) |
| `npm run build` | Production build           |
| `npm run start` | Run production server      |
| `npm run lint`  | Run ESLint                 |

**Note**: If the gateway runs on port 3000, run the frontend on a different port, e.g. `npm run dev -- -p 3001`.

## Project structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx    # Root layout, metadata, dark theme
│   │   ├── page.tsx      # Main dashboard page (state, polling, infer)
│   │   └── globals.css   # Tailwind + custom classes (card, badge, buttons)
│   └── components/
│       ├── types.ts           # ApiResponse, StatusResponse
│       ├── ActiveCommandBar.tsx  # Current drone + model command
│       ├── StatusCard.tsx        # Gateway status, metrics, last tool, LLM summary
│       ├── HistoryTable.tsx      # Last 10 inferences (table / cards)
│       ├── PromptForm.tsx       # Textarea + send prompt
│       ├── QuickActions.tsx     # One-click SAR prompts (model tools)
│       └── ToolsPanel.tsx       # List of model + drone tools
├── next-env.d.ts
├── package.json
└── README.md
```

## API usage

- **GET `/status`**: Polled every 10 seconds for state, model, override, latencies, memory. Used by `StatusCard` and to show connection.
- **POST `/infer`**: Sends `{"Infer": {"prompt": "..."}}` when the user submits a prompt or picks a quick action. If the LLM proposes a tool, the response has `pending_approval: true` and the UI shows Accept/Reject; the active command cards update only after Accept. Sends `{"ApplyTool": {"category", "tool_name"}}` when the user accepts a proposal. History gets one entry per outcome (no double entry).

See the gateway [README](../gateway/README.md) and [AGENTS.md](../gateway/AGENTS.md) for full API details.

## Styling

- Dark theme by default (`className="dark"` on `<html>`).
- Tailwind with custom utilities in `globals.css`: `.card`, `.badge`, `.badge-active`, `button.primary`, `button.outline`, `textarea.prompt-input`, `code.llm-response`.
- Safe-area padding and responsive layout for mobile; grid adapts (e.g. tools panel moves below history on small screens).

For agent-oriented conventions and integration details, see **AGENTS.md** in this folder.
