import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

for (const f of ["en_US.aff", "en_US.dic", "phrase-rules.json"]) {
  const path = join(dataDir, f);
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
  console.log(`${f} ${hash}`);
}
