// Import Third-party Dependencies
import {
  Systems,
  createViewHelper
} from "@jolly-pixel/engine";
import * as THREE from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Import Internal Dependencies
import { SelectiveGlitchPass } from "./SelectiveGlitchPass.ts";

export interface WorldRenderPassOptions {
  /**
   * @default "composer"
   */
  renderMode?: Systems.RenderMode;
  /**
   * @default false
   */
  debug?: boolean;
}

export function createWorldRenderPass(
  world: Systems.GameInstance,
  options: WorldRenderPassOptions
) {
  const {
    renderMode = "composer",
    debug = false
  } = options;
  world.renderer.setRenderMode(renderMode);

  return (camera: THREE.Camera) => {
    const scene = world.scene.getSource();
    if (debug) {
      createViewHelper(camera, world);
    }

    if (renderMode !== "composer") {
      return;
    }

    world.renderer.setEffects(
      new UnrealBloomPass(
        world.input.getScreenSize(),
        0.25,
        0.1,
        0.25
      ),
      new SelectiveGlitchPass(scene, camera),
      new OutputPass()
    );
  };
}
