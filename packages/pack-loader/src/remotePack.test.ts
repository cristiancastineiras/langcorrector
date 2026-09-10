import assert from "node:assert/strict";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { sha256Hex } from "./checksum.js";
import { fetchAndCachePack } from "./remotePack.js";
import type { LanguagePackManifest } from "./types.js";

const REGISTRY_URL = "https://example.invalid/packs";

function makeFakeFetch(files: Record<string, string>): { fetch: typeof fetch; calls: string[] } {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    const path = url.replace(`${REGISTRY_URL}/`, "");
    const body = files[path];
    if (body === undefined) {
      return { ok: false, status: 404, json: async () => ({}), text: async () => "" } as Response;
    }
    return { ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body } as Response;
  }) as typeof fetch;
  return { fetch: fetchImpl, calls };
}

function fixtureFiles(version = "1.0.0"): Record<string, string> {
  const aff = "SET UTF-8\n";
  const dic = "1\nhola\n";
  const phraseRules = JSON.stringify([{ id: "demo", pattern: "x", flags: "g", replacement: "y", message: "z" }]);
  const manifest: LanguagePackManifest = {
    locale: "es",
    displayName: "Español",
    version,
    license: "MIT",
    source: "test fixture",
    files: { aff: "es.aff", dic: "es.dic", phraseRules: "phrase-rules.json" },
    checksums: { "es.aff": sha256Hex(aff), "es.dic": sha256Hex(dic), "phrase-rules.json": sha256Hex(phraseRules) },
  };
  return {
    "es/pack.json": JSON.stringify(manifest),
    "es/es.aff": aff,
    "es/es.dic": dic,
    "es/phrase-rules.json": phraseRules,
  };
}

test("descarga, verifica checksums y cachea un pack remoto", async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), "langcorrector-cache-"));
  const { fetch: fetchImpl } = makeFakeFetch(fixtureFiles());

  const pack = await fetchAndCachePack("es", { registryUrl: REGISTRY_URL, cacheDir, fetchImpl });

  assert.equal(pack.manifest.version, "1.0.0");
  assert.equal(pack.dic, "1\nhola\n");

  const cached = await readdir(join(cacheDir, "es", "1.0.0"));
  assert.deepEqual(
    [...cached].sort(),
    ["es.aff", "es.dic", "pack.json", "phrase-rules.json"].sort(),
  );
});

test("no vuelve a descargar si ya hay una copia cacheada de la misma versión", async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), "langcorrector-cache-"));
  const { fetch: fetchImpl, calls } = makeFakeFetch(fixtureFiles());

  await fetchAndCachePack("es", { registryUrl: REGISTRY_URL, cacheDir, fetchImpl });
  const callsAfterFirst = calls.length;
  await fetchAndCachePack("es", { registryUrl: REGISTRY_URL, cacheDir, fetchImpl });

  assert.equal(calls.length, callsAfterFirst + 1); // solo vuelve a pedir pack.json, no los ficheros
});

test("un checksum que no coincide aborta sin dejar caché a medias", async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), "langcorrector-cache-"));
  const files = fixtureFiles();
  files["es/es.dic"] = "1\nmanipulado\n"; // no coincide con el checksum del manifest
  const { fetch: fetchImpl } = makeFakeFetch(files);

  await assert.rejects(
    () => fetchAndCachePack("es", { registryUrl: REGISTRY_URL, cacheDir, fetchImpl }),
    /Checksum inválido/,
  );

  await assert.rejects(() => readdir(join(cacheDir, "es", "1.0.0", "pack.json")));
});
