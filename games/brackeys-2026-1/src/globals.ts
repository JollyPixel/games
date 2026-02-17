// Import Third-party Dependencies
import {
  GlobalAudioManager,
  SignalEvent
} from "@jolly-pixel/engine";

export const EventsMap = {
  PlayerRespawned: new SignalEvent(),
  clear() {
    this.PlayerRespawned.clear();
  }
} as const;

export interface GameContext {
  layers: {
    glitch: number;
  };
  events: typeof EventsMap;
  audioManager: GlobalAudioManager;
}
