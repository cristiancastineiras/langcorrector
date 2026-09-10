import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createPhraseRuleChecker } from "./phraseRules.js";
import type { PhraseRuleDefinition } from "@langcorrector/pack-loader";

// Prueba las reglas de puntuación TAL COMO ESTÁN en el pack real (no una
// copia a mano que podría desincronizarse) — ver
// packages/pack-es/data/phrase-rules.json.
const rules = JSON.parse(
  readFileSync(new URL("../../pack-es/data/phrase-rules.json", import.meta.url), "utf8"),
) as PhraseRuleDefinition[];

function checkerFor(id: string) {
  const rule = rules.find((r) => r.id === id);
  assert.ok(rule, `no existe una regla con id "${id}" en pack-es/data/phrase-rules.json`);
  return createPhraseRuleChecker([rule]);
}

test("punctuation-question-mark: añade ¿ cuando falta", () => {
  const check = checkerFor("punctuation-question-mark");
  const [issue] = check("Desea continuar?");
  assert.ok(issue);
  assert.equal(issue!.suggestions[0], "¿Desea continuar?");
});

test("punctuation-question-mark: no toca una pregunta ya bien puntuada", () => {
  const check = checkerFor("punctuation-question-mark");
  assert.deepEqual(check("¿Desea continuar?"), []);
});

test("punctuation-question-mark: no toca texto sin interrogación", () => {
  const check = checkerFor("punctuation-question-mark");
  assert.deepEqual(check("Guardar cambios"), []);
});

test("punctuation-exclamation-mark: añade ¡ cuando falta", () => {
  const check = checkerFor("punctuation-exclamation-mark");
  const [issue] = check("Cuidado!");
  assert.equal(issue!.suggestions[0], "¡Cuidado!");
});

test("punctuation-double-space: colapsa espacios dobles a uno", () => {
  const check = checkerFor("punctuation-double-space");
  const [issue] = check("Hola  mundo");
  assert.equal(issue!.suggestions[0], " ");
});

test("punctuation-missing-space-after: añade el espacio que falta tras una coma", () => {
  const check = checkerFor("punctuation-missing-space-after");
  const [issue] = check("Hola,mundo");
  assert.equal(issue!.suggestions[0], ", ");
});

test("punctuation-missing-space-after: no se dispara con separadores de miles (coma seguida de dígito)", () => {
  const check = checkerFor("punctuation-missing-space-after");
  assert.deepEqual(check("1,234 euros"), []);
});
