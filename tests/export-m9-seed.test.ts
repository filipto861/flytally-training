import test from "node:test";
import { gzipSync } from "node:zlib";
import { staticTrainingContentSeed } from "../lib/static-content-repository.ts";

test("export current M9 static seed", () => {
  const payload = {
    aircraft: staticTrainingContentSeed.aircraft,
    universalModules: staticTrainingContentSeed.universalModules ?? [],
  };
  const encoded = gzipSync(Buffer.from(JSON.stringify(payload), "utf8")).toString("base64");
  console.log(`M9_SEED_GZIP_BASE64=${encoded}`);
});
