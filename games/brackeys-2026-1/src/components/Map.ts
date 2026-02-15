// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube } from "./map/Cube.ts";

// CONSTANTS
export const TILE_TYPE = Object.freeze({
  Empty: 0,
  Wall: 1,
  Spawn: Symbol("Spawn")
}) satisfies Record<string, Tile>;

export const TILE_TEXTURE = {
  [TILE_TYPE.Wall]: "textures/cube.png"
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

      if (tile !== TILE_TYPE.Wall) {
        this.#walkableTiles.add(`${x}.${z}`);
      }
    }
  }

  #initTerrainFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.width, this.height);
    const floorMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color("black")
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

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

      if (tile !== TILE_TYPE.Wall) {
        continue;
      }

      const wall = new Cube({
        size: 1,
        texture: TILE_TEXTURE[tile]
      });
      wall.position.set(x, 0.5, z);
      this.actor.threeObject.add(wall);
    }
  }
}
