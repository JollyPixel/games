// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import type { TiledMap } from "@jolly-pixel/voxel.renderer";
import { parseStringPromise } from "xml2js";

// CONSTANTS
const tilemapsDir = path.join(import.meta.dirname, "..", "public", "tilemaps");

const filePath = path.join(
  tilemapsDir,
  "brackeys-level.tmj"
);
await cleanTiledMapJSON(filePath);

async function cleanTiledMapJSON(
  filePath: string
): Promise<void> {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const tileMap: TiledMap = JSON.parse(rawData);

  for (const ts of tileMap.tilesets) {
    if (!ts.source) {
      continue;
    }

    const XMLdata = fs.readFileSync(
      path.join(tilemapsDir, ts.source),
      "utf-8"
    );

    const tileData = await parseStringPromise(XMLdata, {
      explicitArray: false,
      mergeAttrs: true
    });
    ts.columns = parseInt(tileData.tileset.columns, 10);
    ts.tilecount = parseInt(tileData.tileset.tilecount, 10);
    ts.tilewidth = parseInt(tileData.tileset.tilewidth, 10);
    ts.tileheight = parseInt(tileData.tileset.tileheight, 10);
  }

  const cleanedData = stringifyWithInlineData(tileMap);
  fs.writeFileSync(
    filePath,
    cleanedData,
    "utf-8"
  );
}

function replacer(key: string, value: unknown) {
  if (key === "data") {
    // Return a placeholder, then fix it after
    return `__INLINE__${JSON.stringify(value)}__INLINE__`;
  }

  return value;
}

function stringifyWithInlineData(obj: unknown, indent = 2) {
  const result = JSON.stringify(obj, replacer, indent);

  // Replace the quoted placeholder with the raw inlined JSON
  return result
    .replace(/"__INLINE__(.*?)__INLINE__"/gs, (_, inner) => inner
      .replace(/\\"/g, "\"")
      .replace(/\\\\/g, "\\"));
}
