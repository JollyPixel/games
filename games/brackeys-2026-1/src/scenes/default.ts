// Import Third-party Dependencies
import {
  Systems,
  Actor,
  createViewHelper
} from "@jolly-pixel/engine";
import * as THREE from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Import Internal Dependencies
import * as components from "../components/index.ts";
import type { SceneOptions } from "./types.ts";

export function createDefaultScene(
  world: Systems.GameInstance,
  options: SceneOptions = {}
) {
  const { debug = false } = options;
  world.renderer.setRenderMode("composer");

  const webglRenderer = world.renderer.getSource();
  webglRenderer.shadowMap.enabled = true;
  webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = world.scene.getSource();
  scene.background = new THREE.Color(0x000000);
  scene.add(new THREE.AmbientLight("white", 0));

  const grid: components.TileGrid = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, components.TILE_TYPE.Spawn, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

  /**
   * TODO engine:
   *
   * - implement createActor method to GameInstance that creates an Actor and adds it to the world
   * - rename registerComponent -> addComponent
   */

  const game = new Actor(world, { name: "GameRootEntity" });
  if (debug) {
    game.registerComponent(components.Grid, { ratio: 1, size: 32 });
  }

  new Actor(world, { name: "Map", parent: game })
    .registerComponent(components.Map, { grid });

  new Actor(world, { name: "Player", parent: game })
    .registerComponent(components.Player);

  new Actor(world, { name: "Camera", parent: game })
    .registerComponent(components.Camera, void 0, (component) => {
      world.renderer.setEffects(
        new UnrealBloomPass(world.input.getScreenSize(), 0.25, 0.1, 0.25),
        new OutputPass()
      );

      createViewHelper(component.camera, world);
    });
}
