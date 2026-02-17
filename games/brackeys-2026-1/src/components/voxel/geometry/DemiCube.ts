// Import Third-party Dependencies
import * as THREE from "three";

// Import Internal Dependencies
import { BaseGeometry, type BaseGeometryRequiredOptions } from "./BaseGeometry.ts";

export class DemiCube extends BaseGeometry {
  constructor(
    options: BaseGeometryRequiredOptions
  ) {
    super(options);

    // NOTE: UV may need to be adjusted if the texture is not a square
    this.geometry = new THREE.BoxGeometry(
      this.size / BaseGeometry.RATIO,
      this.size / (BaseGeometry.RATIO * 2),
      this.size / BaseGeometry.RATIO
    );
  }
}
