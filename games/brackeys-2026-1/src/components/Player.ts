// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube } from "./map/Cube.ts";
import type { Map } from "./Map.ts";
import * as utils from "../utils/index.ts";

export interface PlayerOptions {

}

export class Player extends ActorComponent {
  #map: Map;
  #targetPosition: THREE.Vector3 | null = null;
  #moving = false;
  #moveCooldown = 10;
  #lastMoveTime = 0;
  #smooth = 0.3;

  constructor(
    actor: Actor,
    _options: PlayerOptions = {}
  ) {
    super({
      actor,
      typeName: "PlayerBehavior"
    });
  }

  warpToSpawn() {
    this.actor.transform.setLocalPosition(this.#map.spawnPoint);
    this.#targetPosition = this.#map.spawnPoint.clone();
  }

  awake(): void {
    const player = new Cube({
      size: 1,
      color: new THREE.Color("green")
    });
    this.actor.threeObject.add(player);
  }

  start() {
    const mapActor = this.actor.gameInstance.scene.tree.getActor("Map");
    if (!mapActor) {
      throw new Error("Map actor not found");
    }

    this.#map = utils.getComponentByName<Map>(mapActor, "MapBehavior");
    this.warpToSpawn();
  }

  update() {
    const { input } = this.actor.gameInstance;
    const now = performance.now();

    // Si en déplacement, interpole vers la cible
    if (this.#targetPosition && this.#moving) {
      const current = this.actor.threeObject.position;
      current.lerp(this.#targetPosition, this.#smooth);

      // Si proche de la cible, stoppe le mouvement
      if (current.distanceTo(this.#targetPosition) < 0.05) {
        this.actor.threeObject.position.copy(this.#targetPosition);
        this.#targetPosition = null;
        this.#moving = false;
        this.#lastMoveTime = now;
      }

      return;
    }

    // Si cooldown actif, ne rien faire
    if (now - this.#lastMoveTime < this.#moveCooldown) {
      return;
    }

    let dx = 0;
    let dz = 0;

    if (input.wasKeyJustPressed("KeyW")) {
      dz += 1;
    }
    if (input.wasKeyJustPressed("KeyS")) {
      dz -= 1;
    }
    if (input.wasKeyJustPressed("KeyA")) {
      dx += 1;
    }
    if (input.wasKeyJustPressed("KeyD")) {
      dx -= 1;
    }

    if (dx !== 0 || dz !== 0) {
      const current = this.actor.threeObject.position;
      const nextX = current.x + dx;
      const nextZ = current.z + dz;

      if (this.#map.isWalkable(nextX, nextZ)) {
        this.#targetPosition = new THREE.Vector3(nextX, current.y, nextZ);
        this.#moving = true;
      }
    }
  }
}
