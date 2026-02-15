// Import Third-party Dependencies
import * as THREE from "three";

// Import Internal Dependencies
import { Shape, type ShapeOptions } from "./Shape.ts";

export class DemiCube extends Shape {
  constructor(
    options: ShapeOptions
  ) {
    super(options);
    this.geometry = new THREE.BoxGeometry(
      this.size / Shape.RATIO,
      this.size / (Shape.RATIO * 2),
      this.size / Shape.RATIO
    );
  }
}
