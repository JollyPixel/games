/* eslint-disable @stylistic/no-mixed-operators */
// Import Third-party Dependencies
import {
  ActorComponent,
  ModelRenderer,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Terrain, type Camera, type Overlay } from "./index.ts";
import type { GameContext } from "../globals.ts";
import * as utils from "../utils/index.ts";

export interface PlayerOptions {
  /**
   * Duration of the roll animation in seconds.
   * @default 0.15
   */
  rollDuration?: number;

  /**
   * Cooldown between roll moves in milliseconds.
   * @default 10
   */
  rollMoveCoolDown?: number;
}

export class Player extends ActorComponent<GameContext> {
  #terrain: Terrain;
  #camera: Camera;
  #overlay: Overlay;
  #model: ModelRenderer;

  #mesh: THREE.Group;

  #moving = false;
  #rollProgress = 0;
  #rollDuration = 0.15;
  #rollCooldown: utils.Timer;
  #rollAxis = new THREE.Vector3();
  #rollPivot = new THREE.Vector3();
  #rollStartQuat = new THREE.Quaternion();

  get visualPosition() {
    return this.#mesh.getWorldPosition(new THREE.Vector3());
  }

  constructor(
    actor: Actor<GameContext>,
    options: PlayerOptions = {}
  ) {
    super({
      actor,
      typeName: "PlayerBehavior"
    });

    const {
      rollDuration = 0.15,
      rollMoveCoolDown = 10
    } = options;

    this.#rollDuration = rollDuration;
    this.#rollCooldown = new utils.Timer(rollMoveCoolDown);
  }

  warpToPosition(
    position: THREE.Vector3
  ) {
    position.y += 0.5;

    this.#moving = false;
    this.#rollProgress = 0;
    this.actor.transform.setLocalPosition(position);
    this.#mesh.position.set(0, 0, 0);
    this.#mesh.quaternion.identity();
  }

  warpToSpawn() {
    const { events } = this.context;

    const spawn = this.#terrain.getCustomTileFirstPosition("Spawn");
    if (spawn) {
      events.PlayerRespawned.emit();
      this.warpToPosition(spawn.clone());
    }
  }

  awake(): void {
    const light = new THREE.PointLight(0x00ff44, 2, 12, 1.5);
    light.position.set(0, 1.5, 0);

    this.actor.addChildren(light);
  }

  start() {
    const { tree } = this.actor.world.sceneManager;
    const { layers } = this.context;

    this.#model = this.actor.getComponent(ModelRenderer)!;
    this.#mesh = this.#model.group;
    this.#mesh.scale.set(0.5, 0.5, 0.5);
    this.#mesh.castShadow = true;
    this.#mesh.layers.enable(layers.glitch);

    const cameraActor = tree.getActor("Camera")!;

    this.#terrain = tree
      .getActor("Terrain")!
      .getComponent<Terrain>("TerrainBehavior")!;
    this.#camera = cameraActor.getComponent<Camera>(
      "CameraBehavior"
    )!;
    this.#overlay = cameraActor.getComponent<Overlay>(
      "Overlay"
    )!;

    this.warpToSpawn();
  }

  update(
    deltaTime: number
  ) {
    const { context, input } = this.actor.world;

    if (context.paused) {
      return;
    }

    // JUST FOR TESTING: respawn on R key
    if (input.wasKeyJustPressed("KeyR")) {
      context.paused = true;
      this.#overlay.fadeIn(() => {
        this.warpToSpawn();
        this.#overlay.fadeOut();
        context.paused = false;
      });
    }

    if (this.#moving) {
      this.#rollProgress += deltaTime / this.#rollDuration;

      if (this.#rollProgress >= 1) {
        this.#rollProgress = 1;
        this.#applyRoll(1);
        this.#mesh.position.set(0, 0, 0);
        this.#moving = false;
        this.#rollCooldown.start();
      }
      else {
        this.#applyRoll(this.#rollProgress);
      }

      return;
    }

    if (!this.#rollCooldown.ready) {
      return;
    }

    let forward = 0;
    let right = 0;

    // TODO: implement Arrow keys and gamepad support
    if (input.wasKeyJustPressed("KeyW")) {
      forward += 1;
    }
    if (input.wasKeyJustPressed("KeyS")) {
      forward -= 1;
    }
    if (input.wasKeyJustPressed("KeyA")) {
      right -= 1;
    }
    if (input.wasKeyJustPressed("KeyD")) {
      right += 1;
    }

    if (forward !== 0 || right !== 0) {
      // Rotate input direction by camera azimuth
      const azimuth = this.#camera.azimuth;
      const cos = Math.cos(azimuth);
      const sin = Math.sin(azimuth);

      // Camera forward is along -sin(az), -cos(az) in world XZ
      const rawX = forward * -sin + right * cos;
      const rawZ = forward * -cos + right * -sin;

      // Snap to nearest cardinal direction (grid-based movement)
      let dx = 0;
      let dz = 0;
      if (Math.abs(rawX) >= Math.abs(rawZ)) {
        dx = Math.sign(rawX);
      }
      else {
        dz = Math.sign(rawZ);
      }

      const current = this.actor.object3D.position;
      const nextX = current.x + dx;
      const nextZ = current.z + dz;

      if (this.#terrain.isWalkable(nextX, nextZ)) {
        this.#startRoll(dx, dz);
        this.actor.object3D.position.set(nextX, current.y, nextZ);
      }
    }
  }

  #startRoll(
    dx: number,
    dz: number
  ) {
    this.#moving = true;
    this.#rollProgress = 0;

    // Pivot is the bottom edge in the movement direction (in local space)
    // Cube center is at (0, 0, 0) local, bottom face at y = -0.5
    this.#rollPivot.set(dx * 0.5, -0.5, dz * 0.5);

    // Rotation axis: cross(up, moveDir) = (dz, 0, -dx)
    this.#rollAxis.set(dz, 0, -dx).normalize();

    // Save current rotation as start
    this.#rollStartQuat.copy(this.#mesh.quaternion);

    // Offset the cube mesh back by (-dx, 0, -dz) since we already snapped actor position forward
    this.#mesh.position.set(-dx, 0, -dz);
  }

  #applyRoll(
    t: number
  ) {
    const angle = t * (Math.PI / 2);

    // Vector from pivot to the cube's starting center (before roll)
    // Starting center in local space = (-dx, 0, -dz), pivot = (-dx + dx*0.5, -0.5, -dz + dz*0.5)
    // But pivot is already computed relative to the original position.
    // Since the cube starts at (-dx, 0, -dz) local, the vector from pivot to center is:
    // (-dx, 0, -dz) - (dx*0.5, -0.5, dz*0.5) = (-dx - dx*0.5, 0.5, -dz - dz*0.5)
    // But that's messy. Let me use the pivot relative to the starting cube position.

    // The cube starts at local (-dx, 0, -dz). Pivot in local space is at
    // start + (dx*0.5, -0.5, dz*0.5) relative to the original center.
    // Actually: pivot is the bottom edge of the cube at the movement-direction side.
    // In the cube's starting local position (-dx, 0, -dz), the pivot is at:
    // (-dx + dx*0.5, -0.5, -dz + dz*0.5) = (-dx*0.5, -0.5, -dz*0.5)
    const pivot = new THREE.Vector3(-this.#rollPivot.x, this.#rollPivot.y, -this.#rollPivot.z);
    const startLocal = new THREE.Vector3(-this.#rollPivot.x * 2, 0, -this.#rollPivot.z * 2);
    const arm = new THREE.Vector3().subVectors(startLocal, pivot);

    // Rotate the arm around the axis
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(this.#rollAxis, angle);
    arm.applyQuaternion(rollQuat);

    // New position = pivot + rotated arm
    this.#mesh.position.copy(pivot).add(arm);

    // New rotation = rollQuat * startQuat
    this.#mesh.quaternion.copy(rollQuat).multiply(this.#rollStartQuat);
  }
}
