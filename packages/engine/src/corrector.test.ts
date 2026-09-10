import assert from "node:assert/strict";
import { test } from "node:test";
import { createLanguageCorrector } from "./corrector.js";
import type { LoadedLanguagePack } from "@langcorrector/pack-loader";

const pack: LoadedLanguagePack = {
  manifest: {
    locale: "es",
    displayName: "Español (fixture)",
    version: "0.0.1",
    license: "MIT",
    source: "test fixture",
    files: { aff: "es.aff", dic: "es.dic", phraseRules: "phrase-rules.json" },
    checksums: {},
  },
  aff: "SET UTF-8\nTRY esianrtolcdugmphbyfvkwz\n",
  dic: "2\nhola\nsucedido\n",
  phraseRules: [
    {
      id: "grammar-haber",
      pattern: "\\bA (sucedido)\\b",
      flags: "g",
      replacement: "Ha $1",
      message: '"A $1" probablemente debería ser "Ha $1".',
    },
  ],
};

test("combina ortografía y reglas de gramática, ordenadas por posición", async () => {
  const corrector = createLanguageCorrector(pack);
  assert.equal(corrector.locale, "es");

  const issues = await corrector.check("A sucedido: holaa");
  const rules = issues.map((i) => i.rule);
  assert.deepEqual(rules, ["grammar-haber", "spelling"]);
  assert.ok(issues[0]!.start < issues[1]!.start);
});
