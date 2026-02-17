// Import Third-party Dependencies
import * as THREE from "three";

// CONSTANTS
const kFirstTextureAppearRate = 0.9;

type NonEmptyArray<T> = [T, ...T[]];

export type TileSetTexture = THREE.Texture<HTMLImageElement>;
export type TileSetTilesRecord<T extends string | number = string> = Partial<
  Record<T, THREE.Vector2Like | NonEmptyArray<THREE.Vector2Like>>
>;

export interface TileSetOptions<T extends string | number = string> {
  tileWidth: number;
  tileHeight?: number;
  tiles?: TileSetTilesRecord<T>;
}

export interface GetTileOptions {
  cache?: boolean;
}

export class TileSet<T extends string | number = string> {
  #texture: TileSetTexture;
  #tileWidth: number;
  #tileHeight: number;
  #tiles: TileSetTilesRecord<T>;
  #cache = new Map<T, TileSetTexture>();

  constructor(
    texture: TileSetTexture,
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
  ): TileSetTexture {
    const tileTexture = this.#texture.clone();
    const size = this.tileSizeUV;

    const offsetY = 1 - ((row + 1) * size.y);
    tileTexture.offset.set(col * size.x, offsetY);
    tileTexture.repeat.set(size.x, size.y);
    tileTexture.needsUpdate = true;

    return tileTexture;
  }

  getTile(
    name: T,
    options: GetTileOptions = {}
  ): TileSetTexture {
    const { cache = true } = options;

    const cached = this.#cache.get(name);
    if (cache && cached) {
      return cached;
    }

    const offsets = this.#tiles[name];
    if (!offsets) {
      throw new Error(`Tile "${name}" not found in tileset`);
    }

    const offset: THREE.Vector2Like = Array.isArray(offsets) ?
      this.#pickWeightedOffset(offsets) :
      offsets;

    const texture = this.getTileAt(offset.x, offset.y);
    if (cache) {
      this.#cache.set(name, texture);
    }

    return texture;
  }

  #pickWeightedOffset(
    offsets: NonEmptyArray<THREE.Vector2Like>
  ): THREE.Vector2Like {
    if (offsets.length === 1 || Math.random() < kFirstTextureAppearRate) {
      return offsets[0];
    }

    const randomIndex = 1 + Math.floor(Math.random() * (offsets.length - 1));

    return offsets[randomIndex];
  }
}
