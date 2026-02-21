// Import Third-party Dependencies
import {
  Systems,
  ModelRenderer,
  UIRenderer,
  Actor
} from "@jolly-pixel/engine";
import {
  VoxelRenderer
} from "@jolly-pixel/voxel.renderer";
import * as THREE from "three";

// Import Internal Dependencies
import { createWorldRenderPass, OverlayPass } from "../passes/index.ts";
import * as components from "../components/index.ts";
import { type GameContext } from "../globals.ts";

export class DefaultScene extends Systems.Scene<GameContext> {
  initializeRenderPass: ReturnType<typeof createWorldRenderPass>;
  overlayPass = new OverlayPass(0x000000);

  constructor(
    world: Systems.World<THREE.WebGLRenderer, GameContext>
  ) {
    super("DefaultScene");

    this.overlayPass.uniforms.uOpacity.value = 1;

    this.initializeRenderPass = createWorldRenderPass(world, {
      renderMode: "composer",
      overlayPass: this.overlayPass,
      debug: world.debug
    });

    const webglRenderer = world.renderer.getSource();
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = world.sceneManager.getSource();

    scene.background = new THREE.Color(0x000000);
    scene.add(new THREE.AmbientLight("white", 0.3));

    world.createActor("UIScreen")
      .addComponent(UIRenderer)
      .addComponent(components.GameScreen);

    const game = world.createActor("Game")
      .addComponent(components.Grid, { ratio: 4, size: 32 });

    world.createActor("Terrain", { parent: game })
      .addComponent(VoxelRenderer, {
        material: "standard",
        materialCustomizer: (material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = 0;
            material.roughness = 0.85;
          }
        }
      })
      .addComponent(components.VoxelMap, {
        onCustomTileInit
      });

    world.createActor("Player", { parent: game })
      .addComponent(components.Player)
      .addComponent(ModelRenderer, {
        path: "models/Avatar001_v1.obj"
      });

    world.createActor("Camera", { parent: game })
      .addComponent(components.Overlay, { pass: this.overlayPass })
      .addComponent(components.Camera, void 0, (component) => {
        this.initializeRenderPass(component.camera);
      });
  }
}

function onCustomTileInit(
  actor: Actor<GameContext>,
  tile: components.VoxelCustomTile
): THREE.Object3D | void {
  const { name, position, properties } = tile;

  if (name === "Spawn") {
    const lightedTile = actor.addComponentAndGet(components.LightedTile, {
      color: 0x0066ff,
      pulse: { min: 0.25, max: 1, duration: 1500 },
      positionalAudio: {}
    });
    lightedTile.setPosition(position);

    return lightedTile.group;
  }
  else if (name.startsWith("TP_")) {
    const destination = properties.target;
    if (typeof destination !== "string") {
      console.warn(`Teleport tile "${name}" is missing a valid "target" property.`);

      return void 0;
    }

    actor.addComponent(components.Teleport, {
      destination,
      position
    });

    const tile = actor.addComponentAndGet(components.LightedTile, {
      color: new THREE.Color("green")
    });
    tile.setPosition(position);

    return tile.group;
  }

  return void 0;
}

