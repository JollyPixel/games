// Import Third-party Dependencies
import {
  GlobalAudioManager,
  AudioLibrary,
  SignalEvent
} from "@jolly-pixel/engine";

export const EventsMap = {
  PlayerRespawned: new SignalEvent(),
  clear() {
    this.PlayerRespawned.clear();
  }
} as const;

export interface GameContext {
  paused: boolean;
  layers: {
    glitch: number;
  };
  events: typeof EventsMap;
  audioManager: GlobalAudioManager;
  audioSfx: AudioLibrary;
}
