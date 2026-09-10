import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { sha256Hex } from "./checksum.js";
import { loadLocalPack } from "./localPack.js";
import type { LanguagePackManifest } from "./types.js";

async function makeFixturePack(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "langcorrector-pack-"));
  const aff = "SET UTF-8\n";
  const dic = "1\nhola\n";
  const phraseRules = JSON.stringify([
    { id: "demo", pattern: "\\bA sucedido\\b", flags: "g", replacement: "Ha sucedido", message: "demo" },
  ]);

  const manifest: LanguagePackManifest = {
    locale: "es",
    displayName: "Español",
    version: "0.0.1-fixture",
    license: "MIT",
    source: "test fixture",
    files: { aff: "es.aff", dic: "es.dic", phraseRules: "phrase-rules.json" },
    checksums: {
      "es.aff": sha256Hex(aff),
      "es.dic": sha256Hex(dic),
      "phrase-rules.json": sha256Hex(phraseRules),
    },
  };

  await writeFile(join(dir, "pack.json"), JSON.stringify(manifest), "utf8");
  await writeFile(join(dir, "es.aff"), aff, "utf8");
  await writeFile(join(dir, "es.dic"), dic, "utf8");
  await writeFile(join(dir, "phrase-rules.json"), phraseRules, "utf8");
  return dir;
}

test("carga un pack local válido y verifica sus checksums", async () => {
  const dir = await makeFixturePack();
  const pack = await loadLocalPack(dir);
  assert.equal(pack.manifest.locale, "es");
  assert.equal(pack.dic, "1\nhola\n");
  assert.equal(pack.phraseRules.length, 1);
  assert.equal(pack.phraseRules[0]!.id, "demo");
});

test("rechaza un pack con un fichero que no coincide con su checksum", async () => {
  const dir = await makeFixturePack();
  await writeFile(join(dir, "es.dic"), "1\nmanipulado\n", "utf8");
  await assert.rejects(() => loadLocalPack(dir), /Checksum inválido/);
});
