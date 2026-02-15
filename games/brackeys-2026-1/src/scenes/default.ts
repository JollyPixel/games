// Import Third-party Dependencies
import {
  Systems,
  Actor,
  Camera3DControls
} from "@jolly-pixel/engine";
// import * as THREE from "three";

// Import Internal Dependencies
import * as components from "../components/index.ts";
import type { SceneOptions } from "./types.ts";

export function createDefaultScene(
  world: Systems.GameInstance,
  options: SceneOptions = {}
) {
  const { debug = false } = options;

  const scene = world.scene.getSource();
  scene.background = null;

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

  new Actor(world, { name: "Player", parent: game })
    .registerComponent(components.Player);

  new Actor(world, { name: "Camera", parent: game })
    // TODO: implement a custom Camera for the game
    // .registerComponent(components.Camera)
    .registerComponent(
      Camera3DControls,
      { speed: 0.25, rotationSpeed: 0.50 },
      (component) => {
        component.camera.position.set(5, 5, 5);
        component.camera.lookAt(0, 0, 0);
      }
    );

  new Actor(world, { name: "Map", parent: game })
    .registerComponent(components.Map);
}
