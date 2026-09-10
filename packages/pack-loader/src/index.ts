import { join } from "node:path";
import { loadLocalPack } from "./localPack.js";
import { fetchAndCachePack, type RemotePackOptions } from "./remotePack.js";
import type { LoadedLanguagePack } from "./types.js";

export type { LanguagePackManifest, LoadedLanguagePack, PhraseRuleDefinition } from "./types.js";
export { loadLocalPack, readManifest } from "./localPack.js";
export { fetchAndCachePack } from "./remotePack.js";
export type { RemotePackOptions } from "./remotePack.js";
export { sha256Hex, assertChecksum, ChecksumMismatchError } from "./checksum.js";

export interface ResolvePackOptions {
  /** Directorio con packs bundleados localmente: `<localPacksDir>/<locale>/pack.json`. */
  localPacksDir?: string;
  /** Si el pack no está en `localPacksDir` (o no se indica), se busca/cachea aquí. */
  remote?: RemotePackOptions;
}

export async function resolvePack(locale: string, options: ResolvePackOptions): Promise<LoadedLanguagePack> {
  if (options.localPacksDir) {
    try {
      return await loadLocalPack(join(options.localPacksDir, locale));
    } catch (error) {
      if (!options.remote) throw error;
      // Sin pack local para este idioma: seguimos al remoto en vez de fallar.
    }
  }
  if (options.remote) return fetchAndCachePack(locale, options.remote);
  throw new Error(`No se encontró un pack de idioma para "${locale}" (ni local ni remoto configurado).`);
}
