
// Import Third-party Dependencies
import {
  ActorComponent,
  Actor
} from "@jolly-pixel/engine";
import {
  VoxelRenderer,
  loadVoxelTiledMap,
  type VoxelLayerJSON,
  // type VoxelObjectJSON,
  type VoxelObjectLayerJSON
} from "@jolly-pixel/voxel.renderer";
import * as THREE from "three";

// Import Internal Dependencies
import type { GameContext } from "../globals.ts";

export type VoxelCustomTileInitFn<TContext = GameContext> = (
  actor: Actor<TContext>,
  tile: VoxelCustomTile
) => THREE.Object3D | void;

export interface VoxelCustomTile<T = Record<string, any>> {
  id: string;
  name: string;
  position: THREE.Vector3;
  properties: T;
}

export interface VoxelMapOptions<TContext = GameContext> {
  onCustomTileInit?: VoxelCustomTileInitFn<TContext>;
}

export class VoxelMap extends ActorComponent<GameContext> {
  #walkableTiles: Set<`${number}.${number}`> = new Set();
  #objects: VoxelCustomTile[] = [];
  #onCustomTileInit?: VoxelCustomTileInitFn;

  world = loadVoxelTiledMap("tilemaps/brackeys-level.tmj");

  constructor(
    actor: Actor<GameContext>,
    options: VoxelMapOptions<GameContext> = {}
  ) {
    super({
      actor,
      typeName: "VoxelMap"
    });
    const { onCustomTileInit } = options;
    this.#onCustomTileInit = onCustomTileInit;
  }

  isWalkable(
    x: number,
    z: number
  ): boolean {
    return this.#walkableTiles.has(`${x}.${z}`);
  }

  awake() {
    const world = this.world.get();

    const voxelRenderer = this.actor.getComponent(VoxelRenderer)!;
    voxelRenderer
      .load(world)
      .catch(console.error);

    const groundLayer = world.layers?.[0];
    if (groundLayer) {
      this.#initializeWalkableTiles(groundLayer);
    }

    for (const layer of world.objectLayers ?? []) {
      this.#initializeObjectLayer(layer);
    }
  }

  getTileByName<T = Record<string, any>>(
    name: string
  ): VoxelCustomTile<T> | undefined {
    return this.#objects.find(
      (tile) => tile.name === name
    ) as VoxelCustomTile<T> | undefined;
  }

  #initializeWalkableTiles(
    layer: VoxelLayerJSON
  ) {
    for (const voxel of Object.keys(layer.voxels)) {
      const [x, _, z] = voxel.split(",").map(Number);
      this.#walkableTiles.add(`${x}.${z}`);
    }
  }

  #initializeObjectLayer(
    layer: VoxelObjectLayerJSON
  ) {
    for (const object of layer.objects) {
      const position = new THREE.Vector3(
        Math.round(object.x),
        1,
        Math.round(object.z)
      );
      const customTile: VoxelCustomTile = {
        id: object.id,
        name: object.name,
        position,
        properties: object.properties ?? {}
      };
      this.#objects.push(customTile);

      const tileActor = new Actor(this.actor.world, {
        name: object.name,
        parent: this.actor
      });

      // if (this.actor.world.debug) {
      //   const mesh = this.#createVisualisationMesh(object, position);
      //   tileActor.addChildren(mesh);
      // }
      const object3D = this.#onCustomTileInit?.(tileActor, customTile);
      if (object3D) {
        tileActor.addChildren(object3D);
      }
    }
  }

  // #createVisualisationMesh(
  //   object: VoxelObjectJSON,
  //   position: THREE.Vector3
  // ) {
  //   const { width = 1, height = 1 } = object;

  //   // Use object dimensions if non-zero, otherwise default to 1x1 marker
  //   const planeWidth = width > 0 ? width : 1;
  //   const depth = height > 0 ? height : 1;

  //   const geometry = new THREE.PlaneGeometry(planeWidth, depth);

  //   const material = new THREE.MeshBasicMaterial({
  //     color: 0x00ff00,
  //     side: THREE.DoubleSide,
  //     transparent: true,
  //     opacity: 0.6
  //   });

  //   const plane = new THREE.Mesh(geometry, material);
  //   plane.rotation.x = -Math.PI / 2;
  //   plane.position.set(position.x, position.y, position.z);

  //   return plane;
  // }
}
