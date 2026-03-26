// NPC movement AI — stationary toggle and patrol pathfinding.

import { SCENES, isWalkable } from "../data/scenes";

export function chooseNpcMove(sceneKey, npc, occupied, player) {
  // Stationary NPCs only animate their walk cycle, no position change.
  if (npc.stationary) return { ...npc, step: (npc.step || 0) ^ 1 };

  const sceneData = SCENES[sceneKey];

  const dirs = [
    { key: "up",    dx:  0, dy: -1 },
    { key: "down",  dx:  0, dy:  1 },
    { key: "left",  dx: -1, dy:  0 },
    { key: "right", dx:  1, dy:  0 },
  ];

  const valid = dirs.filter(({ dx, dy }) => {
    const nx = npc.x + dx;
    const ny = npc.y + dy;
    // Stay inside patrol zone if one is defined.
    if (npc.patrol) {
      if (nx < npc.patrol.x1 || nx > npc.patrol.x2) return false;
      if (ny < npc.patrol.y1 || ny > npc.patrol.y2) return false;
    }
    return (
      isWalkable(sceneData, nx, ny, occupied) &&
      !(player.x === nx && player.y === ny)
    );
  });

  if (!valid.length) return { ...npc, step: (npc.step || 0) ^ 1 };

  // Prefer continuing in the same direction (55% chance) for smoother movement.
  const same = valid.find((d) => d.key === npc.dir);
  const chosen =
    same && Math.random() < 0.55
      ? same
      : valid[Math.floor(Math.random() * valid.length)];

  return {
    ...npc,
    x: npc.x + chosen.dx,
    y: npc.y + chosen.dy,
    dir: chosen.key,
    step: (npc.step || 0) ^ 1,
  };
}
