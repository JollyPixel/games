// Import Third-party Dependencies
import { Runtime, loadRuntime } from "@jolly-pixel/runtime";
import {
  GlobalAudio,
  GlobalAudioManager,
  AudioLibrary,
  AudioBackground
} from "@jolly-pixel/engine";

// Import Internal Dependencies
import { DefaultScene } from "./scenes/default.ts";
import {
  EventsMap,
  type GameContext
} from "./globals.ts";

const canvasHTMLElement = document.querySelector("canvas");
if (!canvasHTMLElement) {
  throw new Error("HTMLCanvasElement not found");
}

const debug = true;

const audio = new GlobalAudio();
const runtime = new Runtime<GameContext>(canvasHTMLElement, {
  // Displays a stats.js FPS panel — useful during development
  includePerformanceStats: debug,
  audio,
  context: {
    paused: false,
    layers: {
      glitch: 1
    },
    events: EventsMap,
    audioManager: null as unknown as GameContext["audioManager"],
    audioSfx: null as unknown as GameContext["audioSfx"]
  }
});

const audioManager = GlobalAudioManager.fromWorld(runtime.world);
runtime.world.context.audioManager = audioManager;

const audioSfx = new AudioLibrary();
audioSfx.register("engine-loop", "sounds/engine-looping_1.wav");
runtime.world.context.audioSfx = audioSfx;

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

audio.observe(bg);
audio.volume = 0.15;

const defaultScene = new DefaultScene(runtime.world, { debug });

canvasHTMLElement.addEventListener("click", async() => {
  await bg.play("main.ambiant");
}, { once: true });

loadRuntime(runtime)
  .then(() => {
    runtime.world.sceneManager.setScene(defaultScene);
  })
  .catch(console.error);
