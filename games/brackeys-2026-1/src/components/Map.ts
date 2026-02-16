// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube, DemiCube } from "./map/index.ts";

// CONSTANTS
export const TILE_TYPE = Object.freeze({
  Empty: 0,
  Wall: 1,
  DemiWall: 2
}) satisfies Record<string, Tile>;

export const TILE_TEXTURE = {
  [TILE_TYPE.Wall]: "textures/cube.png",
  [TILE_TYPE.DemiWall]: "textures/cube.png"
} satisfies Record<Tile, string>;

const kDefaultGrid = [
  [TILE_TYPE.Wall]
];

export type Tile = number | string;
export type TilePosition = THREE.Vector3;
export type TileGrid = Tile[][];

export type CustomInitCallback = (position: TilePosition) => THREE.Object3D | void;

export interface CustomTileMetadata {
  onInit?: CustomInitCallback;
  tiles: {
    position: TilePosition;
  }[];
}

export interface VoxelMapOptions {
  grid?: TileGrid;
}

export class VoxelMap extends ActorComponent {
  static Y = 0;

  height: number;
  width: number;
  grid: TileGrid;

  #walkableTiles = new Set<`${number}.${number}`>();
  #customTiles: globalThis.Map<string, CustomTileMetadata> = new globalThis.Map();

  constructor(
    actor: Actor,
    options: VoxelMapOptions = {}
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
    this.#preloadTerrainEntities();
    this.#initTerrain();
  }

  addCustomTile(
    name: string,
    onInit?: CustomInitCallback
  ) {
    this.#customTiles.set(name, {
      onInit,
      tiles: []
    });
  }

  getCustomTileFirstPosition(
    name: string
  ): TilePosition | null {
    const tileData = this.#customTiles.get(name);
    if (!tileData || tileData.tiles.length === 0) {
      return null;
    }

    return tileData.tiles[0].position;
  }

  isWalkable(
    x: number,
    z: number
  ): boolean {
    return this.#walkableTiles.has(`${x}.${z}`);
  }

  #preloadTerrainEntities() {
    for (const { tile, x, z } of this) {
      if (typeof tile === "string" && this.#customTiles.has(tile)) {
        const customTileData = this.#customTiles.get(tile)!;
        const position = new THREE.Vector3(x, VoxelMap.Y, z);
        const object3D = customTileData.onInit?.(position);
        if (object3D) {
          this.actor.threeObject.add(object3D);
        }
        customTileData.tiles.push({ position });
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
  }
}
