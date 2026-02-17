// Import Third-party Dependencies
import {
  Systems,
  createViewHelper
} from "@jolly-pixel/engine";
import * as THREE from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import type { Pass } from "three/addons/postprocessing/Pass.js";

// Import Internal Dependencies
import { SelectiveGlitchPass } from "./SelectiveGlitchPass.ts";
import type { OverlayPass } from "./OverlayPass.ts";

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
  world: Systems.World<THREE.WebGLRenderer, any>,
  options: WorldRenderPassOptions
) {
  const {
    renderMode = "composer",
    debug = false
  } = options;
  world.renderer.setRenderMode(renderMode);

  return (camera: THREE.Camera, overlayPass?: OverlayPass) => {
    const scene = world.sceneManager.getSource();
    if (debug) {
      createViewHelper(camera, world);
    }

    if (renderMode !== "composer") {
      return;
    }

    const effects: Pass[] = [
      new UnrealBloomPass(
        world.input.getScreenSize(),
        0.38,
        0.5,
        0.35
      ),
      new SelectiveGlitchPass(scene, camera),
      new OutputPass()
    ];
    if (overlayPass) {
      effects.push(overlayPass);
    }

    world.renderer.setEffects(...effects);
  };
}
