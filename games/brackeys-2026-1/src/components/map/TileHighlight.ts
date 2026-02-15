// Import Third-party Dependencies
import * as THREE from "three";

export interface TileHighlightOptions {
  color?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  borderWidth?: number;
  lightIntensity?: number;
  lightDistance?: number;
}

export function createTileHighlight(
  options: TileHighlightOptions = {}
): THREE.Group {
  const {
    color = 0x0066ff,
    emissiveIntensity = 1.5,
    borderWidth = 0.06,
    lightIntensity = 1.5,
    lightDistance = 6
  } = options;

  const group = new THREE.Group();
  const edgeHeight = 0.02;
  const tileSize = 1;
  const edgeLength = tileSize;

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity,
    metalness: 0.3,
    roughness: 0.4
  });

  const topEdge = new THREE.Mesh(
    new THREE.BoxGeometry(edgeLength, edgeHeight, borderWidth),
    material
  );
  topEdge.position.set(0, 0, -tileSize / 2);

  const bottomEdge = new THREE.Mesh(
    new THREE.BoxGeometry(edgeLength, edgeHeight, borderWidth),
    material
  );
  bottomEdge.position.set(0, 0, tileSize / 2);

  const leftEdge = new THREE.Mesh(
    new THREE.BoxGeometry(borderWidth, edgeHeight, edgeLength),
    material
  );
  leftEdge.position.set(-tileSize / 2, 0, 0);

  const rightEdge = new THREE.Mesh(
    new THREE.BoxGeometry(borderWidth, edgeHeight, edgeLength),
    material
  );
  rightEdge.position.set(tileSize / 2, 0, 0);

  group.add(topEdge, bottomEdge, leftEdge, rightEdge);

  const light = new THREE.PointLight(
    new THREE.Color(color),
    lightIntensity,
    lightDistance
  );
  light.position.set(0, 0.3, 0);
  group.add(light);

  return group;
}
