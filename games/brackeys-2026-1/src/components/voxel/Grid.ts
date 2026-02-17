// Import Third-party Dependencies
import * as THREE from "three";
import type { Actor } from "@jolly-pixel/engine";

// Import Internal Dependencies
import { TileType } from "./TileType.ts";
import { CustomTile } from "./CustomTile.ts";
import {
  type Tile,
  type TileGrid
} from "./types.ts";

export interface GridInitTileOptions {
  actor: Actor;
  tile: Tile;
  x: number;
  z: number;
  y: number;
}

export class Grid {
  height: number;
  width: number;
  grid: TileGrid;
  tileType: TileType<any>;
  customTile = new CustomTile();

  #walkableTiles = new Set<`${number}.${number}`>();

  constructor(
    grid: TileGrid,
    tileType: TileType<any>
  ) {
    if (grid.length === 0) {
      throw new Error("Grid cannot be empty");
    }

    this.grid = grid;
    this.tileType = tileType;
    this.height = grid.length;
    this.width = grid[0].length;
  }

  * [Symbol.iterator]() {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const tile = this.grid[row][col];
        const tileName = typeof tile === "string" ?
          tile :
          this.tileType.name(tile);

        yield {
          tile,
          tileName,
          x: col,
          z: row
        };
      }
    }
  }

  isWalkable(
    x: number,
    z: number
  ): boolean {
    return this.#walkableTiles.has(`${x}.${z}`);
  }

  initTile(
    options: GridInitTileOptions
  ): THREE.Object3D | void {
    const { actor, tile, x, z, y } = options;
    if (
      tile !== this.tileType.id("Wall") &&
      tile !== this.tileType.id("DemiWall")
    ) {
      this.#walkableTiles.add(`${x}.${z}`);
    }

    if (typeof tile === "string" && this.customTile.has(tile)) {
      const position = new THREE.Vector3(x, y, z);

      return this.customTile.init(tile, actor, position);
    }

    return void 0;
  }
}
