// Import Third-party Dependencies
import {
  SignalEvent
} from "@jolly-pixel/engine";

export const EventsMap = {
  PlayerRespawned: new SignalEvent(),
  clear() {
    this.PlayerRespawned.clear();
  }
} as const;
