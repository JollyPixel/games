// Import Third-party Dependencies
import {
  ActorComponent,
  type Actor
} from "@jolly-pixel/engine";

export interface CameraOptions {

}

export class Camera extends ActorComponent {
  constructor(
    actor: Actor,
    _options: CameraOptions = {}
  ) {
    super({
      actor,
      typeName: "CameraBehavior"
    });

    // this.actor.gameInstance.renderer.addRenderComponent();
  }
}
