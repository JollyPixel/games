// Import Third-party Dependencies
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
// import * as THREE from "three";

export interface GridOptions {
  size?: number;
  direction?: number;
  ratio: number;
}

export class Grid extends ActorComponent {
  size: number;
  direction: number;
  ratio: number;

  mesh: LineSegments2 | null;
  #elapsed = 0;

  constructor(
    actor: Actor,
    options?: GridOptions
  ) {
    super({ actor, typeName: "GridRenderer" });
    options && this.setGrid(options);
  }

  setIsLayerActive(
    active: boolean
  ) {
    if (this.mesh !== null) {
      this.mesh.visible = active;
    }
  }

  setGrid(
    options: GridOptions
  ) {
    const { size = 50, direction = 1, ratio } = options;
    this.clearMesh();

    this.size = size;
    this.direction = direction;
    this.ratio = ratio;

    this.createMesh();
  }

  resize(
    value: number
  ) {
    this.size = value;
    this.clearMesh();
    this.createMesh();
  }

  setRatio(
    ratio: number
  ) {
    this.ratio = ratio;
    this.clearMesh();
    this.createMesh();
  }

  createMesh() {
    const size = this.ratio * this.size;

    const positions: number[] = [];
    for (let i = -size; i <= size; i += this.ratio) {
      // lignes parallèles à X
      positions.push(-size, 0, i, size, 0, i);
      // lignes parallèles à Z
      positions.push(i, 0, -size, i, 0, size);
    }

    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: 0x00ff44,
      linewidth: 4,
      opacity: 0.05,
      transparent: true
    });

    this.mesh = new LineSegments2(geometry, material);
    this.mesh.position.y = -0.5;
    this.mesh.computeLineDistances();

    this.actor.threeObject.add(this.mesh);
  }

  clearMesh() {
    if (!this.mesh) {
      return;
    }

    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((material) => material.dispose());
    }
    else {
      this.mesh.material.dispose();
    }
    this.actor.threeObject.remove(this.mesh);
    this.mesh = null;
  }

  update(deltaTime: number) {
    if (!this.mesh) {
      return;
    }

    this.#elapsed += deltaTime;
    const pulse = 0.6 + (0.6 * Math.sin(this.#elapsed * 1.1));
    const mat = this.mesh.material as LineMaterial;
    mat.color.setRGB(0, pulse, pulse * 0.27);

    this.mesh.position.x = Math.sin(this.#elapsed * 0.2) * 0.5;
    this.mesh.position.z = Math.cos(this.#elapsed * 0.15) * 0.5;
  }

  override destroy() {
    this.clearMesh();
    super.destroy();
  }
}
