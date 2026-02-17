// Import Third-party Dependencies
import * as THREE from "three";

// Import Internal Dependencies
import { BaseGeometry, type BaseGeometryRequiredOptions } from "./BaseGeometry.ts";

export class Cube extends BaseGeometry {
  constructor(
    options: BaseGeometryRequiredOptions
  ) {
    super(options);
    this.geometry = new THREE.BoxGeometry(
      this.size / BaseGeometry.RATIO,
      this.size / BaseGeometry.RATIO,
      this.size / BaseGeometry.RATIO
    );
  }
}
