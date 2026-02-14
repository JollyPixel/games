// Import Third-party Dependencies
import { Player, loadPlayer } from "@jolly-pixel/runtime";

// Import Internal Dependencies
import { initializeWorld } from "./main.ts";

const canvas = document.querySelector("canvas");
if (!canvas) {
  throw new Error("HTMLCanvasElement not found");
}

const player = new Player(canvas, {
  // Displays a stats.js FPS panel — useful during development
  includePerformanceStats: true
});

initializeWorld(player.gameInstance);

loadPlayer(player)
  .catch(console.error);
