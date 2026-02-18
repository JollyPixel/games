// Import Third-party Dependencies
import {
  Systems
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { createWorldRenderPass, OverlayPass } from "../passes/index.ts";
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

export interface DefaultSceneOptions {
  /**
   * @default false
   */
  debug?: boolean;
}

export class DefaultScene extends Systems.Scene<GameContext> {
  grid = new Voxel.Grid(
    [
      [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2],
      [2, "TP_A", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "TP_B", 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, "Spawn", 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2]
    ],
    new Voxel.TileType(kTilesType)
  );
  tileset: Voxel.TileSet<keyof typeof kTilesType>;
  initializeRenderPass: ReturnType<typeof createWorldRenderPass>;
  overlayPass = new OverlayPass(0x000000);

  constructor(
    world: Systems.World<THREE.WebGLRenderer, GameContext>,
    options: DefaultSceneOptions = {}
  ) {
    super("DefaultScene");

    const { debug = false } = options;
    this.initializeRenderPass = createWorldRenderPass(world, {
      renderMode: "direct",
      overlayPass: this.overlayPass,
      debug
    });

    const webglRenderer = world.renderer.getSource();
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = world.sceneManager.getSource();
    scene.background = new THREE.Color(0x000000);
    scene.add(new THREE.AmbientLight("white", 0.3));

    // scene.background = null;
    // scene.add(new THREE.AmbientLight("white", 2));

    this.tileset = new Voxel.TileSet<keyof typeof kTilesType>(
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
  }

  awake() {
    console.log("DefaultScene awake");
    const world = this.world;

    this.grid.customTile.add("Spawn", (actor, position) => {
      const tile = actor.addComponentAndGet(components.LightedTile, {
        color: 0x0066ff,
        pulse: { min: 0.25, max: 1, duration: 1500 },
        positionalAudio: {}
      });
      tile.setPosition(position);

      return tile.group;
    });
    this.grid.customTile.add("TP_A", (actor, position) => {
      actor.addComponent(components.Teleport, {
        destination: "TP_B",
        position
      });

      const tile = actor.addComponentAndGet(components.LightedTile, {
        color: new THREE.Color("tomato")
      });
      tile.setPosition(position);

      return tile.group;
    });
    this.grid.customTile.add("TP_B", (actor, position) => {
      actor.addComponent(components.Teleport, {
        destination: "TP_A",
        position
      });

      const tile = actor.addComponentAndGet(components.LightedTile, {
        color: new THREE.Color("green")
      });
      tile.setPosition(position);

      return tile.group;
    });

    const game = world.createActor("Game")
      .addComponent(components.Grid, { ratio: 4, size: 32 });

    world.createActor("Terrain", { parent: game })
      .addComponent(components.Terrain, { tileset: this.tileset, grid: this.grid });

    world.createActor("Player", { parent: game })
      .addComponent(components.Player);

    world.createActor("Camera", { parent: game })
      .addComponent(components.Overlay, { pass: this.overlayPass })
      .addComponent(components.Camera, void 0, (component) => {
        this.initializeRenderPass(component.camera);
      });
  }
}
