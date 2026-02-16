// Import Third-party Dependencies
import {
  Systems,
  Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

// Import Internal Dependencies
import { createWorldRenderPass } from "../passes/index.ts";
import * as components from "../components/index.ts";
import type { SceneOptions } from "./types.ts";

export function createDefaultScene(
  world: Systems.GameInstance,
  options: SceneOptions = {}
) {
  const { debug = false } = options;
  const initializeRenderPass = createWorldRenderPass(world, { debug });

  const webglRenderer = world.renderer.getSource();
  webglRenderer.shadowMap.enabled = true;
  webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = world.scene.getSource();
  scene.background = new THREE.Color(0x000000);
  scene.add(new THREE.AmbientLight("white", 0));

  const { Spawn } = components.TILE_TYPE;

  const grid: components.TileGrid = [
    [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, Spawn, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2]
  ];

  /**
   * TODO engine:
   *
   * - implement createActor method to GameInstance that creates an Actor and adds it to the world
   * - rename registerComponent -> addComponent
   */

  const game = new Actor(world, { name: "Game" })
    .registerComponent(components.Grid, { ratio: 2, size: 32 });

  new Actor(world, { name: "Map", parent: game })
    .registerComponent(components.Map, { grid });

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
