// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { Cube } from "./map/Cube.ts";

// CONSTANTS
const kTile = Object.freeze({
  Empty: 0,
  Wall: 1
}) satisfies Record<string, number>;

export type MapCoord = number[][];

export interface MapOptions {
  map?: MapCoord;
}

export class Map extends ActorComponent {
  height: number;
  width: number;
  map: MapCoord;

  constructor(
    actor: Actor,
    options: MapOptions = {}
  ) {
    super({
      actor,
      typeName: "MapBehavior"
    });

    const { map = [[kTile.Wall]] } = options;
    this.map = map;
    this.height = map.length;
    this.width = map[0].length;
  }

  awake(): void {
    this.initTerrain();
  }

  initTerrain() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const floor = new Cube({ size: 1, color: new THREE.Color("black") });
        floor.position.set(x, -1, y);
        this.actor.threeObject.add(floor);

        if (this.map[y][x] === kTile.Empty) {
          continue;
        }

        const cube = new Cube({ size: 0.99, color: new THREE.Color("skyblue") });
        cube.position.set(x, 0, y);
        this.actor.threeObject.add(cube);
      }
    }
  }
}
