// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";
import { Tween, Group as TweenGroup, Easing } from "@tweenjs/tween.js";

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
}

export class LightedTile extends ActorComponent {
  group = new THREE.Group();

  #materials: THREE.MeshStandardMaterial[] = [];
  #light: THREE.PointLight;
  #baseColor: THREE.Color;
  #baseLightIntensity: number;
  #pulseGroup: TweenGroup | null = null;
  #enabled = true;
  #disabledOpacity: number;
  #disabledColor: THREE.Color;

  constructor(
    actor: Actor,
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

    this.actor.threeObject.add(this.group);
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
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
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
