// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";

export interface PlayerOptions {

}

export class Player extends ActorComponent {
  constructor(
    actor: Actor,
    _options: PlayerOptions = {}
  ) {
    super({
      actor,
      typeName: "PlayerBehavior"
    });
  }
}
