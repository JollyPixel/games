// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import * as Geometry from "./geometry/index.ts";
import type { TileSet } from "./TileSet.ts";
import { Grid } from "./Grid.ts";
import type { TilePosition } from "./types.ts";

export interface TerrainOptions {
  grid: Grid;
  tileset: TileSet;
}

export class Terrain extends ActorComponent {
  static Y = 0;

  #grid: Grid;
  #tileset: TileSet;

  constructor(
    actor: Actor,
    options: TerrainOptions
  ) {
    super({
      actor,
      typeName: "TerrainBehavior"
    });

    this.#grid = options.grid;
    this.#tileset = options.tileset;
  }

  get height() {
    return this.#grid.height;
  }

  get width() {
    return this.#grid.width;
  }

  isWalkable(
    x: number,
    z: number
  ): boolean {
    return this.#grid.isWalkable(x, z);
  }

  getCustomTileFirstPosition(
    name: string
  ): TilePosition | null {
    return this.#grid.customTile.positionOf(name);
  }

  awake(): void {
    this.#initTerrain();
  }

  destroy() {
    this.actor.threeObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    super.destroy();
  }

  #initTerrain() {
    for (const { tile, tileName, x, z } of this.#grid) {
      const customObject = this.#grid.initTile({
        actor: this.actor,
        tile,
        x,
        z,
        y: Terrain.Y
      });
      if (customObject) {
        this.actor.threeObject.add(customObject);
      }

      const floor = new Geometry.Cube({
        texture: this.#tileset.getTile("Floor", { cache: false })
      });
      floor.position.set(x, Terrain.Y - 0.5, z);
      this.actor.threeObject.add(floor);

      if (tile === this.#grid.tileType.id("Wall")) {
        const wall = new Geometry.Cube({
          texture: this.#tileset.getTile(tileName)
        });
        wall.castShadow = true;
        wall.position.set(x, 0.5, z);
        this.actor.threeObject.add(wall);
      }
      else if (tile === this.#grid.tileType.id("DemiWall")) {
        const wall = new Geometry.DemiCube({
          texture: this.#tileset.getTile(tileName)
        });
        wall.castShadow = true;
        wall.position.set(x, 0.25, z);
        this.actor.threeObject.add(wall);
      }
    }
  }
}
