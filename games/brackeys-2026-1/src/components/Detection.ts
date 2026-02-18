// Import Third-party Dependencies
import {
  ActorComponent,
  SignalEvent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import type { Player } from "./Player.ts";
import { type GameContext } from "../globals.ts";
import * as utils from "../utils/index.ts";

export interface DetectionOptions {
  /**
   * Position to use for detection. If not set, falls back to the actor's position.
   */
  position?: THREE.Vector3;
  /**
   * Detection radius in world units (XZ plane)
   * @default 0.5
   */
  radius?: number;
  /**
   * Time in milliseconds before losing detection after player leaves the radius
   * @default 1000
   */
  loseDelay?: number;
}

export class Detection extends ActorComponent<GameContext> {
  onEnter = new SignalEvent();
  onExit = new SignalEvent();

  #position: THREE.Vector3 | null;
  #radius: number;
  #loseTimer: utils.Timer;

  #player: Player | null = null;
  #detected = false;
  #inRange = false;

  constructor(
    actor: Actor<GameContext>,
    options: DetectionOptions = {}
  ) {
    super({
      actor,
      typeName: "Detection"
    });

    const { position, radius = 0.5, loseDelay = 1000 } = options;
    this.#position = position?.clone() ?? null;
    this.#radius = radius;
    this.#loseTimer = new utils.Timer(loseDelay);
  }

  get detected() {
    return this.#detected;
  }

  protected get player() {
    return this.#player;
  }

  start() {
    const { sceneManager } = this.actor.world;

    const playerActor = sceneManager.getActor("Player");
    if (playerActor) {
      this.#player = playerActor.getComponent<Player>("PlayerBehavior");
    }
  }

  update() {
    if (!this.#player) {
      this.needUpdate = false;

      return;
    }

    const center = this.#position ?? this.actor.object3D.position;
    const playerPos = this.#player.actor.object3D.position;
    const dx = center.x - playerPos.x;
    const dz = center.z - playerPos.z;
    const distance = Math.sqrt((dx * dx) + (dz * dz));
    const wasInRange = this.#inRange;
    this.#inRange = distance <= this.#radius;

    if (this.#inRange) {
      this.#loseTimer.reset();

      if (!wasInRange) {
        this.#detected = true;
        this.onEnter.emit();
      }
    }
    else if (this.#detected) {
      if (wasInRange) {
        this.#loseTimer.start();
      }

      if (this.#loseTimer.ready) {
        this.#detected = false;
        this.#loseTimer.reset();
        this.onExit.emit();
      }
    }
  }
}
