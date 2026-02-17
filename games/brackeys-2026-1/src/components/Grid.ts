// Import Third-party Dependencies
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

export interface GridOptions {
  /**
   * The total half-size of the grid, in world units. The grid will extend from -size to +size.
   * @default 50
   */
  size?: number;

  /**
   * The spacing between grid lines, in world units. Must be > 0.
   * @default 1
   */
  ratio: number;

  /**
   * The color of the grid lines. Can be any valid THREE.Color representation.
   * @default skyblue
   */
  color?: THREE.ColorRepresentation;
}

export class Grid extends ActorComponent {
  #size: number;
  #ratio: number;
  #color: THREE.ColorRepresentation;

  #mesh: LineSegments2 | null;
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
    if (this.#mesh !== null) {
      this.#mesh.visible = active;
    }
  }

  setGrid(
    options: GridOptions
  ) {
    const { size = 50, ratio = 1 } = options;

    this.clearMesh();
    this.#color = options.color ?? "skyblue";
    this.#size = size;
    this.#ratio = ratio;
    this.createMesh();
  }

  resize(
    value: number
  ) {
    this.#size = value;
    this.clearMesh();
    this.createMesh();
  }

  setRatio(
    ratio: number
  ) {
    this.#ratio = ratio;
    this.clearMesh();
    this.createMesh();
  }

  createMesh() {
    const size = this.#ratio * this.#size;

    const positions: number[] = [];
    for (let i = -size; i <= size; i += this.#ratio) {
      // X
      positions.push(-size, 0, i, size, 0, i);
      // Z
      positions.push(i, 0, -size, i, 0, size);
    }

    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: new THREE.Color(this.#color),
      linewidth: 4,
      opacity: 0.02,
      transparent: true
    });

    this.#mesh = new LineSegments2(geometry, material);
    this.#mesh.position.y = -1.5;
    this.#mesh.computeLineDistances();

    this.actor.addChildren(this.#mesh);
  }

  clearMesh() {
    if (!this.#mesh) {
      return;
    }

    this.actor.removeChildren(this.#mesh);
    this.#mesh = null;
  }

  update(
    deltaTime: number
  ) {
    if (!this.#mesh) {
      return;
    }

    this.#elapsed += deltaTime;
    const pulse = 0.6 + (0.6 * Math.sin(this.#elapsed * 1.1));
    const mat = this.#mesh.material as LineMaterial;
    const base = new THREE.Color(this.#color);
    mat.color.setRGB(
      base.r * pulse,
      base.g * pulse,
      base.b * pulse
    );

    this.#mesh.position.x = Math.sin(this.#elapsed * 0.2) * 0.5;
    this.#mesh.position.z = Math.cos(this.#elapsed * 0.15) * 0.5;
  }

  destroy() {
    this.clearMesh();
    super.destroy();
  }
}
