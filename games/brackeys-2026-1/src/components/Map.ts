// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube } from "./map/Cube.ts";
import { DemiCube } from "./map/DemiCube.ts";
import { createTileHighlight } from "./map/TileHighlight.ts";
import { GLITCH_LAYER } from "../constants.ts";

// CONSTANTS
export const TILE_TYPE = Object.freeze({
  Empty: 0,
  Wall: 1,
  DemiWall: 2,
  Spawn: Symbol("Spawn")
}) satisfies Record<string, Tile>;

export const TILE_TEXTURE = {
  [TILE_TYPE.Wall]: "textures/cube.png",
  [TILE_TYPE.DemiWall]: "textures/cube.png"
} satisfies Record<Tile, string>;

const kDefaultGrid = [
  [TILE_TYPE.Wall]
];

export type Tile = number | symbol;
export type TileGrid = Tile[][];

export interface MapOptions {
  grid?: TileGrid;
}

export class Map extends ActorComponent {
  static Y = 0;

  height: number;
  width: number;
  grid: TileGrid;

  spawnPoint: THREE.Vector3;

  #walkableTiles = new Set<`${number}.${number}`>();

  constructor(
    actor: Actor,
    options: MapOptions = {}
  ) {
    super({
      actor,
      typeName: "MapBehavior"
    });

    const {
      grid = structuredClone(kDefaultGrid)
    } = options;
    if (grid.length === 0) {
      throw new Error("Grid cannot be empty");
    }

    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0].length;

    this.#preloadTerrainEntities();
  }

  * [Symbol.iterator]() {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        yield {
          tile: this.grid[row][col],
          x: col,
          z: row
        };
      }
    }
  }

  awake(): void {
    this.#initTerrain();
  }

  isWalkable(
    x: number,
    z: number
  ): boolean {
    return this.#walkableTiles.has(`${x}.${z}`);
  }

  #preloadTerrainEntities() {
    for (const { tile, x, z } of this) {
      if (tile === TILE_TYPE.Spawn) {
        this.spawnPoint = new THREE.Vector3(x, 0.5, z);
      }

      if (tile !== TILE_TYPE.Wall && tile !== TILE_TYPE.DemiWall) {
        this.#walkableTiles.add(`${x}.${z}`);
      }
    }
  }

  #initTerrainFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.width, this.height);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x111111),
      metalness: 0.0,
      roughness: 0.85
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // floor.receiveShadow = true;

    // Positionne le sol au centre de la grille
    floor.position.set(
      (this.width - 1) / 2,
      0,
      (this.height - 1) / 2
    );
    floor.rotation.x = -Math.PI / 2;

    this.actor.threeObject.add(floor);
  }

  #initTerrain() {
    this.#initTerrainFloor();

    for (const { tile, x, z } of this) {
      // const floor = new Cube({
      //   size: 1,
      //   color: new THREE.Color("black")
      // });
      // floor.position.set(x, Map.Y, z);
      // this.actor.threeObject.add(floor);

      if (tile === TILE_TYPE.Wall) {
        const wall = new Cube({
          size: 1,
          texture: TILE_TEXTURE[tile]
        });
        wall.material = new THREE.MeshStandardMaterial({
          map: new THREE.TextureLoader().load(TILE_TEXTURE[tile]),
          emissive: new THREE.Color(0x556677),
          emissiveIntensity: 0,
          metalness: 0.5,
          roughness: 0
        });
        wall.castShadow = true;
        wall.position.set(x, 0.5, z);
        this.actor.threeObject.add(wall);
      }
      else if (tile === TILE_TYPE.DemiWall) {
        const wall = new DemiCube({
          size: 1,
          texture: TILE_TEXTURE[tile]
        });
        wall.material = new THREE.MeshStandardMaterial({
          map: new THREE.TextureLoader().load(TILE_TEXTURE[tile]),
          emissive: new THREE.Color(0x556677),
          emissiveIntensity: 0,
          metalness: 0.5,
          roughness: 0
        });
        wall.castShadow = true;
        wall.position.set(x, 0.25, z);
        this.actor.threeObject.add(wall);
      }
    }

    // Spawn point highlight
    const spawnHighlight = createTileHighlight({ color: 0x0066ff });
    spawnHighlight.position.set(this.spawnPoint.x, 0.01, this.spawnPoint.z);
    spawnHighlight.layers.enable(GLITCH_LAYER);
    this.actor.threeObject.add(spawnHighlight);
  }
}
