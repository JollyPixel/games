// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";

// Import Internal Dependencies
import type { GameContext } from "../globals.ts";

export interface GlitchOptions {

}

export class Glitch extends ActorComponent<GameContext> {
  constructor(
    actor: Actor<GameContext>,
    _options?: GlitchOptions
  ) {
    super({
      actor,
      typeName: "Glitch"
    });
  }
}
