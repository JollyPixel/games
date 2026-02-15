// Import Third-party Dependencies
import { Player, loadPlayer } from "@jolly-pixel/runtime";

// Import Internal Dependencies
import { createDefaultScene } from "./scenes/default.ts";

const canvas = document.querySelector("canvas");
if (!canvas) {
  throw new Error("HTMLCanvasElement not found");
}

const debug = true;

const player = new Player(canvas, {
  // Displays a stats.js FPS panel — useful during development
  includePerformanceStats: debug
});

createDefaultScene(player.gameInstance, {
  debug
});

loadPlayer(player)
  .catch(console.error);
