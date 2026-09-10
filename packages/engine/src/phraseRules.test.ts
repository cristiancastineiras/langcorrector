import assert from "node:assert/strict";
import { test } from "node:test";
import { createPhraseRuleChecker } from "./phraseRules.js";

const rules = [
  {
    id: "grammar-haber",
    pattern: "\\bA (sucedido|pasado)\\b",
    flags: "g",
    replacement: "Ha $1",
    message: '"A $1" probablemente debería ser "Ha $1".',
  },
];

test("detecta y expande la plantilla de reemplazo con los grupos capturados", () => {
  const check = createPhraseRuleChecker(rules);
  const [issue] = check("A sucedido un error");
  assert.equal(issue!.suggestions[0], "Ha sucedido");
  assert.equal(issue!.message, '"A sucedido" probablemente debería ser "Ha sucedido".');
  assert.equal(issue!.rule, "grammar-haber");
});

test("encuentra varias ocurrencias en el mismo texto", () => {
  const check = createPhraseRuleChecker(rules);
  const issues = check("A sucedido esto y también A pasado aquello");
  assert.equal(issues.length, 2);
});

test("normaliza la flag global aunque el pack no la incluya, para no perder coincidencias", () => {
  const check = createPhraseRuleChecker([{ ...rules[0]!, flags: "" }]);
  const issues = check("A sucedido esto y también A pasado aquello");
  assert.equal(issues.length, 2);
});

test("sin coincidencias no hay issues", () => {
  const check = createPhraseRuleChecker(rules);
  assert.deepEqual(check("Todo correcto por aquí"), []);
});
