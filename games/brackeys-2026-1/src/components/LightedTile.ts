// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";
import { Tween, Group as TweenGroup, Easing } from "@tweenjs/tween.js";

// Import Internal Dependencies
import { type GameContext } from "../globals.ts";

export interface TileEdgesOptions {
  /**
   * Highlight color
   * @default 0x0066ff
   */
  color?: THREE.ColorRepresentation;
  /**
   * Emissive strength
   * @default 1.5
   */
  emissiveIntensity?: number;
  /**
   * Border thickness
   * @default 0.06
   */
  borderWidth?: number;
  /**
   * @default 0.02
   */
  edgeHeight?: number;
}

export interface TilePulseOptions {
  /**
   * Minimum opacity
   * @default 0.3
   */
  min?: number;
  /**
   * Maximum opacity
   * @default 1
   */
  max?: number;
  /**
   * Duration of a full pulse cycle in milliseconds
   * @default 1500
   */
  duration?: number;
}

export interface TileDisabledOptions {
  /**
   * Opacity when disabled
   * @default 0.4
   */
  opacity?: number;
  /**
   * Color when disabled
   * @default 0x444444
   */
  color?: THREE.ColorRepresentation;
}

export interface TileHighlightOptions extends TileEdgesOptions {
  light?: {
    /**
     * Light strength
     * @default 1.5
     */
    intensity?: number;
    /**
     * Light range
     * @default 6
     */
    distance?: number;
  };
  /**
   * Pulse effect configuration. Disabled when not provided.
   */
  pulse?: TilePulseOptions;
  /**
   * Disabled state appearance.
   */
  disabled?: TileDisabledOptions;
  /**
   * Options for positional audio. Disabled when not provided.
   */
  positionalAudio?: {
    /**
     * Show debug mesh
     * @default false
     */
    debugMesh?: boolean;
    /**
     * Debug mesh radius
     * @default 1
     */
    meshRadius?: number;
  };
}

export class LightedTile extends ActorComponent<GameContext> {
  group = new THREE.Group();

  #materials: THREE.MeshStandardMaterial[] = [];
  #light: THREE.PointLight;
  #baseColor: THREE.Color;
  #baseLightIntensity: number;
  #pulseGroup: TweenGroup | null = null;
  #enabled = true;
  #disabledOpacity: number;
  #disabledColor: THREE.Color;

  #positionalAudioOptions: TileHighlightOptions["positionalAudio"] | null = null;
  #positionalAudio: THREE.PositionalAudio | null = null;

  constructor(
    actor: Actor<GameContext>,
    options: TileHighlightOptions = {}
  ) {
    super({
      actor,
      typeName: "LightedTileBehavior"
    });

    const {
      color = 0x0066ff,
      light = {},
      pulse,
      disabled = {},
      positionalAudio,
      ...edgeOptions
    } = options;

    this.#baseColor = new THREE.Color(color);
    this.#disabledOpacity = disabled.opacity ?? 0.4;
    this.#disabledColor = new THREE.Color(disabled.color ?? 0x444444);

    for (const edge of createTileEdges({ color, ...edgeOptions })) {
      this.group.add(edge);
      if (edge instanceof THREE.Mesh) {
        this.#materials.push(edge.material as THREE.MeshStandardMaterial);
      }
    }

    this.#baseLightIntensity = light.intensity ?? 1.5;
    this.#light = new THREE.PointLight(
      new THREE.Color(color),
      this.#baseLightIntensity,
      light.distance ?? 6
    );
    this.#light.position.set(0, 0.3, 0);
    this.group.add(this.#light);

    if (pulse) {
      this.#initPulse(pulse);
    }
    if (positionalAudio) {
      this.#positionalAudioOptions = positionalAudio;
    }

    this.actor.addChildren(this.group);
  }

  start() {
    if (this.#positionalAudioOptions) {
      this.#initPositionalAudio(this.#positionalAudioOptions);
    }
  }

  #initPositionalAudio(
    options: TileHighlightOptions["positionalAudio"] = {}
  ) {
    const { debugMesh = false, meshRadius = 1 } = options;
    const { audioManager, audioSfx } = this.context;

    if (debugMesh) {
      const sphere = new THREE.SphereGeometry(meshRadius, 32, 16);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff2200,
        wireframe: true,
        opacity: 0.7,
        transparent: true,
        depthTest: false
      });
      const mesh = new THREE.Mesh(sphere, material);
      mesh.position.y = meshRadius;
      mesh.renderOrder = 9999;

      this.group.add(mesh);
    }

    const positionalAudio = audioManager.createPositionalAudio(
      audioSfx.get("engine-loop")
    );
    this.#positionalAudio = positionalAudio;
    positionalAudio.setDistanceModel("linear");
    positionalAudio.setRefDistance(10);
    positionalAudio.setMaxDistance(meshRadius + 2);
    positionalAudio.setRolloffFactor(1);
    const gainNode = positionalAudio.gain;
    gainNode.gain.setValueAtTime(0, positionalAudio.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, positionalAudio.context.currentTime + 1.5);

    positionalAudio.play();
    this.group.add(positionalAudio);
  }

  #initPulse(
    options: TilePulseOptions
  ) {
    const {
      min = 0.3,
      max = 1,
      duration = 1500
    } = options;

    const state = { opacity: max };
    const halfDuration = duration / 2;
    const onUpdate = () => this.#applyOpacity(state.opacity);

    this.#pulseGroup = new TweenGroup();

    const fadeOut = new Tween(state, this.#pulseGroup)
      .to({ opacity: min }, halfDuration)
      .easing(Easing.Sinusoidal.InOut)
      .onUpdate(onUpdate);

    const fadeIn = new Tween(state, this.#pulseGroup)
      .to({ opacity: max }, halfDuration)
      .easing(Easing.Sinusoidal.InOut)
      .onUpdate(onUpdate);

    fadeOut.chain(fadeIn);
    fadeIn.chain(fadeOut);

    fadeOut.start();
  }

  #applyOpacity(
    opacity: number
  ) {
    if (!this.#enabled) {
      return;
    }

    for (const material of this.#materials) {
      material.opacity = opacity;
      material.transparent = opacity < 1;
    }
    this.#light.intensity = this.#baseLightIntensity * opacity;
  }

  isEnabled() {
    return this.#enabled;
  }

  enable() {
    if (this.#enabled) {
      return;
    }
    this.#enabled = true;

    for (const material of this.#materials) {
      material.color.copy(this.#baseColor);
      material.emissive.copy(this.#baseColor);
      material.opacity = 1;
      material.transparent = false;
    }
    this.#light.color.copy(this.#baseColor);
    this.#light.intensity = this.#baseLightIntensity;
  }

  disable() {
    if (!this.#enabled) {
      return;
    }
    this.#enabled = false;

    for (const material of this.#materials) {
      material.color.copy(this.#disabledColor);
      material.emissive.copy(this.#disabledColor);
      material.opacity = this.#disabledOpacity;
      material.transparent = true;
    }
    this.#light.color.set(0xffffff);
    this.#light.intensity = 0;
  }

  setPosition(
    position: THREE.Vector3
  ) {
    this.group.position.set(position.x, 0.01, position.z);
  }

  update() {
    if (this.#enabled) {
      this.#pulseGroup?.update();
    }
  }

  destroy() {
    this.#pulseGroup?.removeAll();

    if (this.#positionalAudio) {
      if (this.#positionalAudio.isPlaying) {
        this.#positionalAudio.stop();
      }
      this.#positionalAudio.disconnect();
    }

    super.destroy();
  }
}

export function* createTileEdges(
  options: TileEdgesOptions = {}
): IterableIterator<THREE.Object3D> {
  const {
    color = 0x0066ff,
    emissiveIntensity = 1.5,
    borderWidth = 0.06,
    edgeHeight = 0.02
  } = options;

  const tileSize = 1;

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity,
    metalness: 0.3,
    roughness: 0.4
  });

  const topEdge = new THREE.Mesh(
    new THREE.BoxGeometry(tileSize, edgeHeight, borderWidth),
    material
  );
  topEdge.position.set(0, 0, -tileSize / 2);
  yield topEdge;

  const bottomEdge = new THREE.Mesh(
    new THREE.BoxGeometry(tileSize, edgeHeight, borderWidth),
    material
  );
  bottomEdge.position.set(0, 0, tileSize / 2);
  yield bottomEdge;

  const leftEdge = new THREE.Mesh(
    new THREE.BoxGeometry(borderWidth, edgeHeight, tileSize),
    material
  );
  leftEdge.position.set(-tileSize / 2, 0, 0);
  yield leftEdge;

  const rightEdge = new THREE.Mesh(
    new THREE.BoxGeometry(borderWidth, edgeHeight, tileSize),
    material
  );
  rightEdge.position.set(tileSize / 2, 0, 0);
  yield rightEdge;
}
