// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";

// Import Internal Dependencies
import type { GameContext } from "../globals.ts";

export interface DoorOptions {

}

export class Door extends ActorComponent<GameContext> {
  constructor(
    actor: Actor<GameContext>,
    _options?: DoorOptions
  ) {
    super({
      actor,
      typeName: "Door"
    });
  }
}
