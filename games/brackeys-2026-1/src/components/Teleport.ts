// Import Third-party Dependencies
import { type Actor } from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Detection, type DetectionOptions } from "./Detection.ts";
import type { Overlay } from "./Overlay.ts";
import type { VoxelMap } from "./VoxelMap.ts";
import type { GameContext } from "../globals.ts";
import * as utils from "../utils/index.ts";

export interface TeleportOptions extends DetectionOptions {
  destination: THREE.Vector3 | string;
}

export class Teleport extends Detection {
  static #cooldown = new utils.Timer(1000);

  #destination: THREE.Vector3 | string;
  #resolvedDestination: THREE.Vector3 | null = null;
  #overlay: Overlay;

  constructor(
    actor: Actor<GameContext>,
    options: TeleportOptions
  ) {
    super(actor, options);

    this.#destination = options.destination;
  }

  start() {
    super.start();

    const { tree } = this.actor.world.sceneManager;

    const cameraActor = tree.getActor("Camera")!;
    this.#overlay = cameraActor.getComponent<Overlay>("Overlay")!;

    if (typeof this.#destination === "string") {
      const terrain = tree
        .getActor("Terrain")!
        .getComponent<VoxelMap>("VoxelMap")!;

      const pos = terrain.getTileByName(this.#destination);
      if (!pos) {
        throw new Error(`Teleport: custom tile "${this.#destination}" not found`);
      }
      this.#resolvedDestination = pos.position.clone();
    }
    else {
      this.#resolvedDestination = this.#destination.clone();
    }

    this.onEnter.connect(() => this.#teleport());
  }

  #teleport() {
    const player = this.player;
    if (!player || this.#resolvedDestination === null) {
      return;
    }

    if (!Teleport.#cooldown.ready) {
      return;
    }
    Teleport.#cooldown.start();

    const dest = this.#resolvedDestination.clone();
    this.#overlay.fadeIn(() => {
      this.context.paused = true;
      player.warpToPosition(dest);
      this.#overlay.fadeOut();
      this.context.paused = false;
    });
  }
}
