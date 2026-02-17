// Import Third-party Dependencies
import {
  type ActorComponent,
  type Actor
} from "@jolly-pixel/engine";

/**
 * @example
 * const playerActor = this.actor.gameInstance.scene.tree.getActor("Player")!;
 * const component = utils.getComponentByName(playerActor, "PlayerBehavior");
 */
export function getComponentByName<T extends ActorComponent<any>>(
  actor: Actor<any>,
  componentName: string
): T {
  const component = actor.components.find(
    (comp) => comp.typeName === componentName
  );
  if (!component) {
    throw new Error(`Component with typeName "${componentName}" not found on actor "${actor.name}"`);
  }

  return component as T;
}
