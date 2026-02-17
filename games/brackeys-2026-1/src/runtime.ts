// Import Third-party Dependencies
import { Runtime, loadRuntime } from "@jolly-pixel/runtime";
import {
  GlobalAudio,
  GlobalAudioManager,
  AudioBackground
} from "@jolly-pixel/engine";

// Import Internal Dependencies
import { createDefaultScene } from "./scenes/default.ts";
import {
  EventsMap,
  type GameContext
} from "./globals.ts";

const canvasHTMLElement = document.querySelector("canvas");
if (!canvasHTMLElement) {
  throw new Error("HTMLCanvasElement not found");
}

const debug = true;

const globalAudio = new GlobalAudio();

const runtime = new Runtime(canvasHTMLElement, {
  // Displays a stats.js FPS panel — useful during development
  includePerformanceStats: debug,
  audio: globalAudio,
  context: {
    layers: {
      glitch: 1
    },
    events: EventsMap,
    audioManager: null as unknown as GameContext["audioManager"]
  } satisfies GameContext
});

createDefaultScene(runtime.gameInstance, {
  debug
});

const audioManager = GlobalAudioManager.fromGameInstance(runtime.gameInstance);
runtime.gameInstance.context.audioManager = audioManager;

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

globalAudio.observe(bg);
globalAudio.volume = 0.25;

canvasHTMLElement.addEventListener("click", async() => {
  await bg.play("main.ambiant");
}, { once: true });

loadRuntime(runtime)
  .catch(console.error);
