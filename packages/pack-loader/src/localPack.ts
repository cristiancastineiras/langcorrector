import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { assertChecksum } from "./checksum.js";
import type { LanguagePackManifest, LoadedLanguagePack, PhraseRuleDefinition } from "./types.js";

/**
 * Carga un pack desde un directorio que contenga `pack.json` y los ficheros
 * que referencia. Usado tanto para el pack bundleado con la extensión como,
 * más adelante, para un pack que {@link fetchAndCachePack} ya haya
 * descargado y cacheado en disco — ambos casos comparten exactamente este
 * mismo formato de directorio.
 */
export async function loadLocalPack(dir: string): Promise<LoadedLanguagePack> {
  const manifest = await readManifest(join(dir, "pack.json"));

  const [aff, dic, phraseRulesText] = await Promise.all([
    readAndVerify(dir, manifest, manifest.files.aff),
    readAndVerify(dir, manifest, manifest.files.dic),
    readAndVerify(dir, manifest, manifest.files.phraseRules),
  ]);

  const phraseRules = parsePhraseRules(phraseRulesText, manifest.files.phraseRules);

  return { manifest, aff, dic, phraseRules };
}

export async function readManifest(manifestPath: string): Promise<LanguagePackManifest> {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as LanguagePackManifest;
  if (!manifest.locale || !manifest.files?.aff || !manifest.files?.dic || !manifest.files?.phraseRules) {
    throw new Error(`pack.json inválido en "${manifestPath}": faltan campos obligatorios.`);
  }
  return manifest;
}

async function readAndVerify(dir: string, manifest: LanguagePackManifest, fileName: string): Promise<string> {
  const content = await readFile(join(dir, fileName), "utf8");
  const expected = manifest.checksums[fileName];
  if (expected) {
    assertChecksum(fileName, content, expected);
  }
  return content;
}

function parsePhraseRules(text: string, fileName: string): PhraseRuleDefinition[] {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error(`"${fileName}" debe contener un array de reglas.`);
  }
  return parsed as PhraseRuleDefinition[];
}
