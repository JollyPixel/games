export class TileType<
  T extends Record<string, number> = Record<string, number>
> {
  #nameToId = new Map<string, number>();
  #idToName = new Map<number, string>();

  constructor(
    definitions: T
  ) {
    for (const [name, value] of Object.entries(definitions)) {
      this.#nameToId.set(name, value);
      this.#idToName.set(value, name);
    }
  }

  id(
    name: keyof T & string
  ): number {
    const value = this.#nameToId.get(name);
    if (value === void 0) {
      throw new Error(`Unknown tile name: "${name}"`);
    }

    return value;
  }

  name(
    id: number
  ): keyof T & string {
    const value = this.#idToName.get(id);
    if (value === void 0) {
      throw new Error(`Unknown tile id: ${id}`);
    }

    return value as keyof T & string;
  }
}
