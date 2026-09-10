// "Test" de este paquete: no hay código propio que probar, pero sí un
// invariante real que puede romperse en silencio — que data/pack.json siga
// describiendo fielmente los ficheros que hay en data/. Lo comprueba
// @langcorrector/pack-loader (misma lógica que usará la extensión en
// runtime), así que un pack.json desincronizado falla aquí, no en el editor
// de alguien.
import { loadLocalPack } from "@langcorrector/pack-loader";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

const pack = await loadLocalPack(dataDir);

const dicEntryCount = Number(pack.dic.split("\n", 1)[0]);
if (!Number.isFinite(dicEntryCount) || dicEntryCount <= 0) {
  throw new Error(`es_ES.dic no empieza por un recuento de entradas válido (leído: "${pack.dic.split("\n", 1)[0]}").`);
}
if (pack.phraseRules.length === 0) {
  throw new Error("phrase-rules.json está vacío.");
}

console.log(
  `OK: pack "${pack.manifest.locale}" (${pack.manifest.displayName}) v${pack.manifest.version} — ` +
    `${dicEntryCount} entradas de diccionario, ${pack.phraseRules.length} reglas de gramática, checksums verificados.`,
);
