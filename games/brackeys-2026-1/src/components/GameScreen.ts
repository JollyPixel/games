// Import Third-party Dependencies
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
  ActorComponent,
  UINode,
  type Actor
} from "@jolly-pixel/engine";

// Import Internal Dependencies
import { Overlay } from "./Overlay.ts";
import type { GameContext } from "../globals.ts";

/**
 * Not quite right yet LOL, but good enough for this demo.
 */
export class GameScreen extends ActorComponent<GameContext> {
  #blinkTimer = 0;
  #blinkVisible = true;
  #dismissed = false;
  #overlay: Overlay | null = null;
  #onDismiss: (() => void) | null = null;
  #logoCSS: CSS2DObject | null = null;
  #textElement: HTMLDivElement | null = null;
  #textCSS: CSS2DObject | null = null;

  constructor(
    actor: Actor<GameContext>
  ) {
    super({
      actor,
      typeName: "GameScreen"
    });
  }

  awake() {
    const { world } = this.actor;

    // Logo — CSS2DObject so it renders in the DOM layer above the WebGL overlay pass
    const logoActor = world.createActor("GameScreenLogo", { parent: this.actor });
    const logoNode = logoActor.addComponentAndGet(UINode, {
      size: { width: 300, height: 100 },
      offset: { y: 40 }
    }) as UINode<GameContext>;

    const logoElement = document.createElement("img");
    logoElement.src = "images/game-logo.jpg";
    logoElement.style.width = "300px";
    logoElement.style.height = "auto";

    this.#logoCSS = new CSS2DObject(logoElement);
    this.#logoCSS.position.z = 0.1;
    logoNode.addChildren(this.#logoCSS);

    // Press text
    const textActor = world.createActor("GameScreenText", { parent: this.actor });
    const textNode = textActor.addComponentAndGet(UINode, {
      size: { width: 400, height: 30 },
      offset: { y: -40 }
    }) as UINode<GameContext>;

    this.#textElement = document.createElement("div");
    this.#textElement.textContent = "Use any key to start the game";
    this.#textElement.style.color = "#ffffff";
    this.#textElement.style.fontSize = "16px";
    this.#textElement.style.textAlign = "center";
    this.#textElement.style.letterSpacing = "2px";
    this.#textElement.style.whiteSpace = "nowrap";

    this.#textCSS = new CSS2DObject(this.#textElement);
    this.#textCSS.position.z = 0.1;
    textNode.addChildren(this.#textCSS);

    this.#subscribeKeyboard();
  }

  start() {
    const { world } = this.actor;
    const cameraActor = world.sceneManager.getActor("Camera");
    this.#overlay = cameraActor?.getComponent<Overlay>("Overlay") ?? null;
  }

  /**
   * Re-show the intro screen (e.g. after the player dies).
   * The overlay fades to black first, then the UI becomes visible
   * and waits for any key before fading back out.
   *
   * @param onDismiss - called while the overlay is fully opaque,
   *                    just before it fades back to transparent.
   */
  show(
    onDismiss?: () => void
  ) {
    this.#onDismiss = onDismiss ?? null;
    this.#dismissed = false;
    this.#blinkTimer = 0;
    this.#blinkVisible = true;

    // Hide until the overlay is fully black
    if (this.#logoCSS) {
      this.#logoCSS.visible = false;
    }
    if (this.#textCSS) {
      this.#textCSS.visible = false;
    }

    this.#overlay?.fadeIn(() => {
      if (this.#logoCSS) {
        this.#logoCSS!.visible = true;
      }
      if (this.#textElement) {
        this.#textElement.style.opacity = "1";
      }
      if (this.#textCSS) {
        this.#textCSS!.visible = true;
      }
      this.#subscribeKeyboard();
    });
  }

  update(
    deltaTime: number
  ) {
    if (this.#dismissed || !this.#textElement) {
      return;
    }

    this.#blinkTimer += deltaTime * 1000;
    if (this.#blinkTimer >= 500) {
      this.#blinkTimer -= 500;
      this.#blinkVisible = !this.#blinkVisible;
      this.#textElement.style.opacity = this.#blinkVisible ? "1" : "0";
    }
  }

  #subscribeKeyboard() {
    const { world } = this.actor;
    const handler = () => {
      world.input.keyboard.off("down", handler);
      this.#dismiss();
    };
    world.input.keyboard.on("down", handler);
  }

  #dismiss() {
    this.#dismissed = true;
    const { world } = this.actor;

    if (this.#logoCSS) {
      this.#logoCSS.visible = false;
    }
    if (this.#textCSS) {
      this.#textCSS.visible = false;
    }

    this.#onDismiss?.();

    this.#overlay?.fadeOut(() => {
      world.context.paused = false;
    });
  }
}
