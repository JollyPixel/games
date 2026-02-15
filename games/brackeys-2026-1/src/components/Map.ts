// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";

export interface MapOptions {

}

export class Map extends ActorComponent {
  constructor(
    actor: Actor,
    _options: MapOptions = {}
  ) {
    super({
      actor,
      typeName: "MapBehavior"
    });
  }
}
