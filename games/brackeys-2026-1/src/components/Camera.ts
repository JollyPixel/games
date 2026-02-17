// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import type { Player } from "./Player.ts";
import { type GameContext } from "../globals.ts";
import * as utils from "../utils/index.ts";

export interface CameraOptions {
  /**
   * Distance from the player
   * @default 8
   */
  radius?: number;
  /**
   * Angle from top in degrees (0 = directly above, 90 = horizon)
   * @default 45
   */
  polarAngle?: number;
  /**
   * Position follow smoothing factor (0 = no smoothing, 1 = instant)
   * @default 0.05
   */
  smooth?: number;
  /**
   * Mouse drag rotation sensitivity
   * @default 0.003
   */
  rotationSpeed?: number;
}

export class Camera extends ActorComponent<GameContext> {
  camera: THREE.PerspectiveCamera;

  #player: Player | null = null;
  #radius: number;
  #polarAngle: number;
  #smooth: number;
  #rotationSpeed: number;
  #azimuth = 0;

  get azimuth() {
    return this.#azimuth;
  }

  constructor(
    actor: Actor<GameContext>,
    options: CameraOptions = {}
  ) {
    super({
      actor,
      typeName: "CameraBehavior"
    });

    this.#radius = options.radius ?? 8;
    this.#polarAngle = (options.polarAngle ?? 45) * (Math.PI / 180);
    this.#smooth = options.smooth ?? 0.05;
    this.#rotationSpeed = options.rotationSpeed ?? 0.003;

    const screenSize = this.actor.world.input.getScreenSize();
    this.camera = new THREE.PerspectiveCamera(
      75,
      screenSize.width / screenSize.height,
      0.1,
      100
    );
    this.camera.add(
      this.actor.world.audio.threeAudioListener
    );
    this.actor.world.renderer.addRenderComponent(this.camera);
    this.actor.object3D.add(this.camera);
  }

  start() {
    const playerActor = this.actor.world.sceneManager.tree.getActor("Player");
    if (playerActor) {
      this.#player = utils.getComponentByName<Player>(playerActor, "PlayerBehavior");
    }
  }

  update(
    deltaTime: number
  ) {
    if (!this.#player) {
      return;
    }

    const { input } = this.actor.world;

    if (input.isMouseButtonDown("right")) {
      const delta = input.getMouseDelta();
      this.#azimuth -= delta.x * this.#rotationSpeed;
    }

    const targetPos = this.#player.visualPosition;

    // Spherical to cartesian offset
    const x = this.#radius * Math.sin(this.#polarAngle) * Math.sin(this.#azimuth);
    const z = this.#radius * Math.sin(this.#polarAngle) * Math.cos(this.#azimuth);
    const y = this.#radius * Math.cos(this.#polarAngle);

    const desired = new THREE.Vector3(
      targetPos.x + x,
      targetPos.y + y,
      targetPos.z + z
    );

    const lerpFactor = 1 - Math.pow(1 - this.#smooth, deltaTime * 60);
    this.camera.position.lerp(desired, lerpFactor);

    this.camera.lookAt(targetPos);
  }

  destroy() {
    this.actor.world.renderer.removeRenderComponent(this.camera);
    super.destroy();
  }
}
