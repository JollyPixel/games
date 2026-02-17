// Import Third-party Dependencies
import * as THREE from "three";
import type { RequireAtLeastOne } from "type-fest";

export interface BaseGeometryOptions extends Partial<THREE.MeshStandardMaterialParameters> {
  /**
   * The size of the geometry in world units.
   * @default 1
   */
  size?: number;
  /**
   * Solid color applied to the material.
   */
  color?: THREE.ColorRepresentation;
  /**
   * Texture applied as the material map.
   */
  texture?: THREE.Texture<HTMLImageElement>;
}

export type BaseGeometryRequiredOptions = RequireAtLeastOne<BaseGeometryOptions, "color" | "texture">;

export class BaseGeometry extends THREE.Mesh {
  static RATIO = 1;

  size: number;

  constructor(
    options: BaseGeometryRequiredOptions
  ) {
    super();
    const { size = 1, color, texture, ...materialOptions } = options;

    const defaultMaterialOptions: THREE.MeshStandardMaterialParameters = {
      metalness: 0,
      roughness: 0.85
    };

    this.size = size;
    if (color) {
      this.material = new THREE.MeshStandardMaterial({
        ...defaultMaterialOptions,
        ...materialOptions,
        color
      });
    }
    else if (texture) {
      this.material = new THREE.MeshStandardMaterial({
        ...defaultMaterialOptions,
        ...materialOptions,
        map: texture
      });
    }
  }
}
