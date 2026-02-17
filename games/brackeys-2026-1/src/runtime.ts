// Import Third-party Dependencies
import { Player, loadPlayer } from "@jolly-pixel/runtime";
import {
  GlobalAudioManager,
  AudioBackground
} from "@jolly-pixel/engine";

// Import Internal Dependencies
import { createDefaultScene } from "./scenes/default.ts";

const canvasHTMLElement = document.querySelector("canvas");
if (!canvasHTMLElement) {
  throw new Error("HTMLCanvasElement not found");
}

const debug = true;

const player = new Player(canvasHTMLElement, {
  // Displays a stats.js FPS panel — useful during development
  includePerformanceStats: debug
});

const world = player.gameInstance;

createDefaultScene(player.gameInstance, {
  debug
});

const audioManager = GlobalAudioManager.fromGameInstance(world);
const bg = new AudioBackground({
  audioManager,
  autoPlay: false,
  playlists: [{
    name: "main",
    onEnd: "loop",
    tracks: [
      {
        name: "ambiant",
        path: "sounds/ambiant.ogg"
      }
    ]
  }]
});

world.audio.observe(bg);
world.audio.volume = 0.25;

canvasHTMLElement.addEventListener("click", async() => {
  await bg.play("main.ambiant");
}, { once: true });

loadPlayer(player)
  .catch(console.error);
