// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube } from "./map/Cube.ts";

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

  awake(): void {
    const player = new Cube({ size: 1, color: new THREE.Color("green") });
    this.actor.threeObject.add(player);
  }
}
