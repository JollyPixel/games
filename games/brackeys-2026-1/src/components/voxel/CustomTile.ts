// Import Third-party Dependencies
import * as THREE from "three";
import type { Actor } from "@jolly-pixel/engine";

// Import Internal Dependencies
import type { TilePosition } from "./types.ts";

export type TileInitFn = (actor: Actor, position: TilePosition) => THREE.Object3D | void;

interface CustomTileEntry {
  onInit?: TileInitFn;
  tiles: {
    position: TilePosition;
  }[];
}

export class CustomTile {
  #tiles: Map<string, CustomTileEntry> = new Map();

  add(
    name: string,
    onInit?: TileInitFn
  ) {
    this.#tiles.set(name, {
      onInit,
      tiles: []
    });
  }

  has(
    name: string
  ): boolean {
    return this.#tiles.has(name);
  }

  positionOf(
    name: string
  ): TilePosition | null {
    const entry = this.#tiles.get(name);
    if (!entry || entry.tiles.length === 0) {
      return null;
    }

    return entry.tiles[0].position;
  }

  init(
    name: string,
    actor: Actor,
    position: THREE.Vector3
  ): THREE.Object3D | void {
    const entry = this.#tiles.get(name)!;
    const object3D = entry.onInit?.(actor, position);
    entry.tiles.push({ position });

    return object3D ?? void 0;
  }
}
