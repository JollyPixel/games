// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";
import * as THREE from "three";

export interface CameraOptions {
  /**
   * Distance derrière le joueur
   * @default 4
   */
  distance?: number;
  /**
   * Hauteur au-dessus du joueur
   * @default 3
   */
  height?: number;
  /**
   * Facteur de lissage pour le mouvement de la caméra (0 = pas de lissage, 1 = mouvement instantané)
   * @default 0.1
   */
  smooth?: number;
}

export class Camera extends ActorComponent {
  #camera: THREE.PerspectiveCamera;
  #targetActor: Actor | null = null;
  #distance: number;
  #height: number;
  #smooth: number;

  constructor(
    actor: Actor,
    options: CameraOptions = {}
  ) {
    super({
      actor,
      typeName: "CameraBehavior"
    });

    this.#distance = options.distance ?? 4;
    this.#height = options.height ?? 10;
    this.#smooth = options.smooth ?? 0.01;

    this.#camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.actor.gameInstance.renderer.addRenderComponent(this.#camera);
    this.actor.threeObject.add(this.#camera);
  }

  start() {
    const playerActor = this.actor.gameInstance.scene.tree.getActor("Player");
    if (playerActor) {
      this.#targetActor = playerActor;
    }
  }

  update(
    deltaTime: number
  ) {
    if (!this.#targetActor) {
      return;
    }

    const targetPos = this.#targetActor.threeObject.position;
    const cameraPos = this.#camera.position;

    const desired = new THREE.Vector3(
      targetPos.x - this.#distance,
      targetPos.y + this.#height,
      targetPos.z - this.#distance
    );

    const lerpFactor = 1 - Math.pow(1 - this.#smooth, deltaTime * 60);
    cameraPos.lerp(desired, lerpFactor);

    this.#camera.lookAt(targetPos);
  }
}
