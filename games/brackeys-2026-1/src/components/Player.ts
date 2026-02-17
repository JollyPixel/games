/* eslint-disable @stylistic/no-mixed-operators */
// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Geometry } from "./voxel/index.ts";
import type { Terrain, Camera, Overlay } from "./index.ts";
import * as utils from "../utils/index.ts";
import type { GameContext } from "../globals.ts";

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
  // TODO: should not be here
  #paused = false;

  // Actors and components
  #terrain: Terrain;
  #camera: Camera;
  #overlay: Overlay;

  #mesh: Geometry.Cube;

  // Player animation state
  #moving = false;
  #rollProgress = 0;
  #rollDuration = 0.15;
  #rollLastMoveTime = 0;
  #rollMoveCoolDown = 10;
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
    this.#rollMoveCoolDown = rollMoveCoolDown;
  }

  warpToSpawn() {
    const { events } = this.actor.gameInstance.context;

    events.PlayerRespawned.emit();
    const spawn = this.#terrain.getCustomTileFirstPosition("Spawn")?.clone();
    if (!spawn) {
      throw new Error("Spawn point not found");
    }
    spawn.y += 0.5;

    this.actor.transform.setLocalPosition(spawn);
    this.#mesh.position.set(0, 0, 0);
    this.#mesh.quaternion.identity();
  }

  awake(): void {
    const { layers } = this.actor.gameInstance.context;

    this.#mesh = new Geometry.Cube({
      size: 1,
      color: new THREE.Color("green")
    });
    this.#mesh.material = new THREE.MeshLambertMaterial({
      color: new THREE.Color("green"),
      emissive: new THREE.Color(0x00ff44),
      emissiveIntensity: 0.4
    });
    this.#mesh.castShadow = true;
    this.#mesh.layers.enable(layers.glitch);
    this.actor.threeObject.add(this.#mesh);

    const light = new THREE.PointLight(0x00ff44, 2, 12, 1.5);
    // light.castShadow = true;
    // light.shadow.mapSize.set(512, 512);
    light.position.set(0, 1.5, 0);
    this.actor.threeObject.add(light);
  }

  start() {
    const { tree } = this.actor.gameInstance.scene;

    this.#terrain = utils.getComponentByName<Terrain>(
      tree.getActor("Terrain")!,
      "TerrainBehavior"
    );

    const cameraActor = tree.getActor("Camera")!;
    this.#camera = utils.getComponentByName<Camera>(
      cameraActor,
      "CameraBehavior"
    );
    this.#overlay = utils.getComponentByName<Overlay>(
      cameraActor,
      "Overlay"
    );

    this.warpToSpawn();
  }

  update(
    deltaTime: number
  ) {
    if (this.#paused) {
      return;
    }

    const { input } = this.actor.gameInstance;
    const now = performance.now();

    // JUST FOR TESTING: respawn on R key
    if (input.wasKeyJustPressed("KeyR")) {
      this.#paused = true;
      this.#overlay.fadeIn(() => {
        this.warpToSpawn();
        this.#overlay.fadeOut();
        this.#paused = false;
      });
    }

    if (this.#moving) {
      this.#rollProgress += deltaTime / this.#rollDuration;

      if (this.#rollProgress >= 1) {
        this.#rollProgress = 1;
        this.#applyRoll(1);
        this.#mesh.position.set(0, 0, 0);
        this.#moving = false;
        this.#rollLastMoveTime = now;
      }
      else {
        this.#applyRoll(this.#rollProgress);
      }

      return;
    }

    if (now - this.#rollLastMoveTime < this.#rollMoveCoolDown) {
      return;
    }

    let forward = 0;
    let right = 0;
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

      const current = this.actor.threeObject.position;
      const nextX = current.x + dx;
      const nextZ = current.z + dz;

      if (this.#terrain.isWalkable(nextX, nextZ)) {
        this.#startRoll(dx, dz);
        this.actor.threeObject.position.set(nextX, current.y, nextZ);
      }
    }
  }

  destroy() {
    this.#mesh.geometry.dispose();
    (this.#mesh.material as THREE.Material).dispose();
    super.destroy();
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
