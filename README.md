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