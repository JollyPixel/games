// Import Third-party Dependencies
import * as THREE from "three";

export function generateHeightmap(
  size: number
): THREE.DataTexture {
  const data = new Float32Array(size * size);

  for (let i = 0; i < data.length; i++) {
    data[i] = THREE.MathUtils.randFloat(0, 1);
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RedFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;

  return texture;
}
