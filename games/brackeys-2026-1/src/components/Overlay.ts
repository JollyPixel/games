// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import { Tween, Easing } from "@tweenjs/tween.js";

// Import Internal Dependencies
import { OverlayPass } from "../passes/OverlayPass.ts";

export interface OverlayOptions {
  /**
   * Transition duration in milliseconds
   * @default 750
   */
  duration?: number;
  /**
   * Hold time in milliseconds at target opacity before firing the callback
   * @default 750
   */
  holdDuration?: number;
  /**
   * Overlay pass
   */
  pass?: OverlayPass;
}

export type OverlayCompleteCallback = () => void;

export class Overlay extends ActorComponent {
  pass: OverlayPass;

  #duration: number;
  #holdDuration: number;
  #tween: Tween<any> | null = null;

  constructor(
    actor: Actor,
    options: OverlayOptions = {}
  ) {
    super({ actor, typeName: "Overlay" });

    this.#duration = options.duration ?? 750;
    this.#holdDuration = options.holdDuration ?? 750;
    this.pass = options.pass ?? new OverlayPass(0x000000);
  }

  fadeIn(
    onComplete?: OverlayCompleteCallback
  ): void {
    this.#fadeTo(1, onComplete);
  }

  fadeOut(
    onComplete?: OverlayCompleteCallback
  ): void {
    this.#fadeTo(0, onComplete);
  }

  #fadeTo(
    targetOpacity: number,
    onComplete?: OverlayCompleteCallback
  ): void {
    this.#tween?.stop();

    const uniforms = this.pass.uniforms;
    this.#tween = new Tween(uniforms.uOpacity)
      .to({ value: targetOpacity }, this.#duration)
      .easing(Easing.Quadratic.InOut)
      .delay(targetOpacity === 0 ? this.#holdDuration : 0)
      .onComplete(() => {
        this.#tween = null;
        onComplete?.();
      })
      .start();
  }

  update(): void {
    this.#tween?.update();
  }

  destroy(): void {
    this.#tween?.stop();
    this.pass.dispose();
    super.destroy();
  }
}
