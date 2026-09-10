import assert from "node:assert/strict";
import { test } from "node:test";
import { createSpellChecker, rankSuggestions } from "./spelling.js";

// Diccionario mínimo de prueba (no el pack real de es — eso se prueba en
// packages/pack-es —, aquí solo validamos el motor nspell + el mapeo a
// CorrectionIssue).
const AFF = "SET UTF-8\nTRY esianrtolcdugmphbyfvkwz\n";
const DIC = "3\nhola\nmundo\ncasa\n";

test("no marca palabras que están en el diccionario", () => {
  const check = createSpellChecker(AFF, DIC);
  assert.deepEqual(check("hola mundo"), []);
});

test("marca una palabra que no está y ofrece una sugerencia cercana", () => {
  const check = createSpellChecker(AFF, DIC);
  const [issue] = check("holaa mundo");
  assert.ok(issue);
  assert.equal(issue!.rule, "spelling");
  assert.ok(issue!.suggestions.includes("hola"));
});

test("los offsets del issue apuntan a la palabra exacta en el texto", () => {
  const check = createSpellChecker(AFF, DIC);
  const text = "hola holaa mundo";
  const [issue] = check(text);
  assert.equal(text.slice(issue!.start, issue!.end), "holaa");
});

// nspell no siempre pone primera la sugerencia más natural: para "sesion"
// antepone formas verbales como "sesiona" a "sesión" (misma distancia de
// edición). rankSuggestions() adelanta cualquier sugerencia que sea la
// misma palabra solo con los acentos corregidos — ver el comentario en
// spelling.ts.
test("rankSuggestions antepone la sugerencia que solo corrige acentos", () => {
  const ranked = rankSuggestions("sesion", ["sesiona", "sesione", "sesión", "sesiono"]);
  assert.equal(ranked[0], "sesión");
  assert.deepEqual(new Set(ranked), new Set(["sesiona", "sesione", "sesión", "sesiono"])); // no se pierde ninguna
});

test("rankSuggestions no reordena si ninguna sugerencia es un simple arreglo de acento", () => {
  const ranked = rankSuggestions("Registo", ["Registe", "Regosto", "Registro"]);
  assert.deepEqual(ranked, ["Registe", "Regosto", "Registro"]);
});

test("rankSuggestions antepone extraFirst sin duplicarlo ni perder el resto", () => {
  const ranked = rankSuggestions("acer", ["ayer", "acera", "hacer"], "hacer");
  assert.deepEqual(ranked, ["hacer", "ayer", "acera"]);
});

// Caso real reportado: para "acer" (por "hacer"), nspell sitúa "hacer" en la
// posición 10 de su propia lista de sugerencias — muy por fuera de
// cualquier límite razonable. Con silentPrefixes: ["h"] se detecta y
// antepone explícitamente, sin depender del ranking de nspell.
test("con silentPrefixes, prioriza la palabra con el prefijo aunque nspell no la sugiera primero", () => {
  const dicWithHacer = "4\nhola\nmundo\ncasa\nhacer\n";
  const check = createSpellChecker(AFF, dicWithHacer, { silentPrefixes: ["h"] });
  const [issue] = check("voy a acer algo");
  assert.ok(issue);
  assert.equal(issue!.suggestions[0], "hacer");
});

test("silentPrefixes respeta las mayúsculas del original", () => {
  const dicWithHacer = "4\nhola\nmundo\ncasa\nhacer\n";
  const check = createSpellChecker(AFF, dicWithHacer, { silentPrefixes: ["h"] });
  const [issue] = check("Acer algo");
  assert.equal(issue!.suggestions[0], "Hacer");
});

test("silentPrefixes no se aplica si la palabra ya empieza por ese prefijo", () => {
  const dicWithHacer = "4\nhola\nmundo\ncasa\nhacer\n";
  const check = createSpellChecker(AFF, dicWithHacer, { silentPrefixes: ["h"] });
  const [issue] = check("holaa mundo"); // "holaa" ya empieza por "h"
  assert.ok(!issue!.suggestions.includes("hholaa"));
});
