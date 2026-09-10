import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertChecksum } from "./checksum.js";
import { loadLocalPack } from "./localPack.js";
import type { LanguagePackManifest, LoadedLanguagePack } from "./types.js";

/**
 * Descarga y cachea un pack desde un registry remoto. Verifica el checksum de
 * cada fichero ANTES de escribirlo a disco — si uno no coincide, no se
 * cachea nada de esa descarga.
 *
 * v0: no hay ningún registry real desplegado todavía (`registryUrl` es un
 * placeholder en la configuración de la extensión), pero esta función es
 * real y está testeada con un `fetchImpl` inyectado — el día que exista un
 * registry, activarlo es cambiar una URL, no escribir código nuevo.
 */
export interface RemotePackOptions {
  /** Base del registry, p. ej. "https://github.com/OWNER/REPO/releases/download/packs-v1". */
  registryUrl: string;
  /** Directorio donde cachear packs descargados (p. ej. el globalStorage de la extensión). */
  cacheDir: string;
  /** Inyectable para tests; por defecto usa el `fetch` global de Node. */
  fetchImpl?: typeof fetch;
}

export async function fetchAndCachePack(locale: string, options: RemotePackOptions): Promise<LoadedLanguagePack> {
  const fetchFn = options.fetchImpl ?? fetch;
  const registryBase = options.registryUrl.replace(/\/+$/, "");
  const localeBase = `${registryBase}/${locale}`;

  const manifest = await fetchJson<LanguagePackManifest>(fetchFn, `${localeBase}/pack.json`);
  const targetDir = join(options.cacheDir, manifest.locale, manifest.version);

  if (await isAlreadyCached(targetDir, manifest.version)) {
    return loadLocalPack(targetDir);
  }

  await mkdir(targetDir, { recursive: true });

  for (const fileName of Object.values(manifest.files)) {
    const content = await fetchText(fetchFn, `${localeBase}/${fileName}`);
    const expected = manifest.checksums[fileName];
    if (expected) assertChecksum(fileName, content, expected);
    await writeFile(join(targetDir, fileName), content, "utf8");
  }

  // Escribimos el manifest al final: mientras no exista, isAlreadyCached()
  // considera la caché incompleta y una descarga interrumpida se reintenta
  // entera en vez de quedarse en un estado a medias.
  await writeFile(join(targetDir, "pack.json"), JSON.stringify(manifest, null, 2), "utf8");

  return loadLocalPack(targetDir);
}

async function isAlreadyCached(targetDir: string, expectedVersion: string): Promise<boolean> {
  try {
    const raw = await readFile(join(targetDir, "pack.json"), "utf8");
    const cached = JSON.parse(raw) as LanguagePackManifest;
    return cached.version === expectedVersion;
  } catch {
    return false;
  }
}

async function fetchJson<T>(fetchFn: typeof fetch, url: string): Promise<T> {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`No se pudo descargar "${url}": HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function fetchText(fetchFn: typeof fetch, url: string): Promise<string> {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`No se pudo descargar "${url}": HTTP ${response.status}`);
  return response.text();
}
