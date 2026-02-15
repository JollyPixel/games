/* eslint-disable @stylistic/no-mixed-operators */
// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube } from "./map/Cube.ts";
import type { Map } from "./Map.ts";
import type { Camera } from "./Camera.ts";
import { EventsMap } from "../events.ts";
import * as utils from "../utils/index.ts";

export interface PlayerOptions {

}

export class Player extends ActorComponent {
  #map: Map;
  #camera: Camera;
  #cube: Cube;
  #moving = false;
  #moveCooldown = 10;
  #lastMoveTime = 0;

  // Roll animation state
  #rollProgress = 0;
  #rollDuration = 0.15;
  #rollAxis = new THREE.Vector3();
  #rollPivot = new THREE.Vector3();
  #rollStartQuat = new THREE.Quaternion();

  get visualPosition() {
    return this.#cube.getWorldPosition(new THREE.Vector3());
  }

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
    EventsMap.PlayerRespawned.emit();
    this.actor.transform.setLocalPosition(this.#map.spawnPoint);
    this.#cube.position.set(0, 0, 0);
    this.#cube.quaternion.identity();
  }

  awake(): void {
    this.#cube = new Cube({
      size: 1,
      color: new THREE.Color("green")
    });
    this.#cube.material = new THREE.MeshLambertMaterial({
      color: new THREE.Color("green"),
      emissive: new THREE.Color(0x00ff44),
      emissiveIntensity: 0.4
    });
    this.#cube.castShadow = true;
    this.actor.threeObject.add(this.#cube);

    const light = new THREE.PointLight(0x00ff44, 2, 12, 1.5);
    // light.castShadow = true;
    // light.shadow.mapSize.set(512, 512);
    light.position.set(0, 1.5, 0);
    this.actor.threeObject.add(light);
  }

  start() {
    const mapActor = this.actor.gameInstance.scene.tree.getActor("Map");
    if (!mapActor) {
      throw new Error("Map actor not found");
    }

    this.#map = utils.getComponentByName<Map>(mapActor, "MapBehavior");

    const cameraActor = this.actor.gameInstance.scene.tree.getActor("Camera");
    if (!cameraActor) {
      throw new Error("Camera actor not found");
    }
    this.#camera = utils.getComponentByName<Camera>(cameraActor, "CameraBehavior");

    this.warpToSpawn();
  }

  update(
    deltaTime: number
  ) {
    const { input } = this.actor.gameInstance;
    const now = performance.now();

    // Animate rolling
    if (this.#moving) {
      this.#rollProgress += deltaTime / this.#rollDuration;

      if (this.#rollProgress >= 1) {
        // Snap: finalize rotation, reset local position
        this.#rollProgress = 1;
        this.#applyRoll(1);
        this.#cube.position.set(0, 0, 0);
        this.#moving = false;
        this.#lastMoveTime = now;
      }
      else {
        this.#applyRoll(this.#rollProgress);
      }

      return;
    }

    // Cooldown
    if (now - this.#lastMoveTime < this.#moveCooldown) {
      return;
    }

    // Raw input in camera-local space (forward = W, right = D)
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

      if (this.#map.isWalkable(nextX, nextZ)) {
        this.#startRoll(dx, dz);
        // Snap actor position to target immediately (cube mesh animates visually)
        this.actor.threeObject.position.set(nextX, current.y, nextZ);
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
    this.#rollStartQuat.copy(this.#cube.quaternion);

    // Offset the cube mesh back by (-dx, 0, -dz) since we already snapped actor position forward
    this.#cube.position.set(-dx, 0, -dz);
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
    this.#cube.position.copy(pivot).add(arm);

    // New rotation = rollQuat * startQuat
    this.#cube.quaternion.copy(rollQuat).multiply(this.#rollStartQuat);
  }
}
