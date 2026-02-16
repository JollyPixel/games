// Import Third-party Dependencies
import * as THREE from "three";

export interface TileSetOptions<T extends string = string> {
  tileWidth: number;
  tileHeight?: number;
  tiles?: Partial<Record<T, THREE.Vector2Like>>;
}

export class TileSet<T extends string = string> {
  #texture: THREE.Texture<HTMLImageElement>;
  #tileWidth: number;
  #tileHeight: number;
  #tiles: Partial<Record<T, THREE.Vector2Like>>;

  constructor(
    texture: THREE.Texture<HTMLImageElement>,
    options: TileSetOptions<T>
  ) {
    const {
      tileWidth,
      tileHeight = tileWidth,
      tiles
    } = options;

    this.#tileWidth = tileWidth;
    this.#tileHeight = tileHeight;
    this.#tiles = tiles ?? Object.create(null);

    this.#texture = texture;
    this.#texture.colorSpace = THREE.SRGBColorSpace;
    this.#texture.magFilter = THREE.NearestFilter;
    this.#texture.minFilter = THREE.NearestFilter;
  }

  get tileSizeUV(): THREE.Vector2Like {
    return {
      x: this.#tileWidth / this.#texture.image.width,
      y: this.#tileHeight / this.#texture.image.height
    };
  }

  getTileAt(
    col: number,
    row: number
  ): THREE.Texture<HTMLImageElement> {
    const tileTexture = this.#texture.clone();
    const size = this.tileSizeUV;

    const offsetY = 1 - ((row + 1) * size.y);
    tileTexture.offset.set(col * size.x, offsetY);
    tileTexture.repeat.set(size.x, size.y);

    return tileTexture;
  }

  getTile(
    name: T
  ): THREE.Texture<HTMLImageElement> {
    const offset = this.#tiles[name];
    if (!offset) {
      throw new Error(`Tile "${name}" not found in tileset`);
    }

    return this.getTileAt(offset.x, offset.y);
  }
}
