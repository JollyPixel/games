// Import Third-party Dependencies
import {
  Systems,
  Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { createWorldRenderPass } from "../passes/index.ts";
import * as components from "../components/index.ts";
import * as Voxel from "../components/voxel/index.ts";
import { type GameContext } from "../globals.ts";

// CONSTANTS
const kTilesType = {
  Floor: -1,
  Empty: 0,
  Wall: 1,
  DemiWall: 2
} as const;

export interface SceneOptions {
  /**
   * @default false
   */
  debug?: boolean;
}

export function createDefaultScene(
  world: Systems.GameInstance<THREE.WebGLRenderer, GameContext>,
  options: SceneOptions = {}
) {
  const { debug = false } = options;
  const initializeRenderPass = createWorldRenderPass(world, { debug });

  const webglRenderer = world.renderer.getSource();
  webglRenderer.shadowMap.enabled = true;
  webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = world.scene.getSource();
  scene.background = new THREE.Color(0x000000);
  scene.add(new THREE.AmbientLight("white", 0.3));

  // scene.background = null;
  // scene.add(new THREE.AmbientLight("white", 2));

  const tileset = new Voxel.TileSet<keyof typeof kTilesType>(
    new THREE.TextureLoader(
      world.loadingManager
    ).load("textures/Tileset001.png"),
    {
      tileWidth: 32,
      tileHeight: 32,
      tiles: {
        Floor: [
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 4, y: 1 },
          { x: 5, y: 1 },
          { x: 6, y: 1 },
          { x: 7, y: 1 },
          { x: 8, y: 1 }
        ],
        Wall: [
          { x: 2, y: 0 }
        ],
        DemiWall: [
          { x: 2, y: 0 }
        ]
      }
    }
  );

  const grid = new Voxel.Grid(
    [
      [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, "Spawn", 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2]
    ],
    new Voxel.TileType(kTilesType)
  );
  grid.customTile.add("Spawn", (actor, position) => {
    const tile = actor.registerComponentAndGet(components.LightedTile, {
      color: 0x0066ff,
      pulse: { min: 0.25, max: 1, duration: 1500 }
    });
    tile.setPosition(position);

    return tile.group;
  });

  const game = new Actor(world, { name: "Game" })
    .registerComponent(components.Grid, { ratio: 4, size: 32 });

  new Actor(world, { name: "Terrain", parent: game })
    .registerComponent(components.Terrain, { tileset, grid });

  new Actor(world, { name: "Player", parent: game })
    .registerComponent(components.Player);

  let overlayPass: components.Overlay["pass"];
  new Actor(world, { name: "Camera", parent: game })
    .registerComponent(components.Overlay, void 0, (overlay) => {
      overlayPass = overlay.pass;
    })
    .registerComponent(components.Camera, void 0, (component) => {
      initializeRenderPass(component.camera, overlayPass);
    });
}
