What each layer is responsible for

constants/game.js	Single source of truth for all numeric constants

engine/mapUtils.js	Pure math helpers, canvas primitives (rect/outline), coordinate transforms

engine/npcLogic.js	NPC movement AI — stationary toggle and patrol pathfinding

data/townMap.js	All town Sets, arrays, blocking Set, townGroundTypeAt

data/officeMap.js	All office Sets, arrays, blocking Set, officeGroundTypeAt

data/scenes.js	SCENES registry, entry/exit tile coords, isWalkable

data/npcs.js	NPC start positions, dialogue strings, getTaskLabel

renderer/tiles.js	Every ground tile draw function + drawGround dispatcher

renderer/props.js	Trees, fences, benches, signs, barrels, flowers, rocks

renderer/buildings.js	Lodge, house, cabin, office building, statues

renderer/furniture.js	Desks, counters, plants, office decor items

renderer/characters.js	drawCritter + drawSpeechBubble

renderer/drawScene.js	Pure drawScene(ctx, params) — orchestrates the full frame

hooks/useGameState.js	All useState/useRef/useEffect — the only place with game logic

components/GameCanvas.jsx	Canvas element + RAF loop, passes state into drawScene

components/HUD.jsx	Title, scene pill, status text

components/InfoRow.jsx	Static info cards at the bottom

App.jsx	Calls useGameState, renders the three components

Key design rule: playerRef and npcRefs are mutable refs that are always kept in sync with state in useGameState. GameCanvas reads from them on every animation frame so the draw loop never has stale positions, while the useEffect dependency array still triggers a loop restart on state changes that matter for rendering (dialog, nearbyNpc, scene, etc.).

Google Sheets logging

Set `SHEETS_ENDPOINT` in `.env.local` to your deployed Apps Script web app `/exec` URL.

Example:

```bash
SHEETS_ENDPOINT="https://script.google.com/macros/s/your-script-id/exec"
```

The app now logs:

- `profile_submitted` when the player starts
- `question_answer` for every in-game question response
- `council_message` for every player and council turn in the debate

Each row includes a persistent `userId` plus a per-session `sessionId`. A starter Apps Script receiver is included at [docs/google-apps-script.gs](/Users/majaarament/Desktop/pixel.gaps/docs/google-apps-script.gs).

Vercel + OpenAI setup

1. Push this repo to GitHub and import it into Vercel as a Vite project.
2. In Vercel, add these environment variables:
   - `OPENAI_API_KEY`
   - `SHEETS_ENDPOINT` (optional, only if you want Google Sheets logging)
3. Deploy. Vercel will serve the React app and the serverless files in `api/`.

React connection

You do not need to put the OpenAI key in React.

The app already calls same-origin API routes:

- `src/engine/councilAI.js` -> `POST /api/council-ai`
- `src/engine/esgGuideAI.js` -> `POST /api/esg-guide`
- `src/engine/logger.js` -> `POST /api/log-event`

That means React should always call `fetch("/api/...")`, and the serverless function should call OpenAI using `process.env.OPENAI_API_KEY`.

If you want a simple test button, you can call the generic route in `api/chat.js` like this:

```js
async function askAI(prompt) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data.text;
}
```

Local development

- `npm run dev` starts the local Node API server on `http://localhost:8787`
- Vite proxies `/api/*` to that server during development
- On Vercel, those same `/api/*` calls are handled by the files in `api/`
