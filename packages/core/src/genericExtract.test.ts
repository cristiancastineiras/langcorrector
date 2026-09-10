import assert from "node:assert/strict";
import { test } from "node:test";
import { extractGenericLiterals } from "./genericExtract.js";

function texts(languageId: string, source: string): string[] {
  return extractGenericLiterals(languageId, source).map((l) => l.text);
}

test("csharp: extrae strings y respeta offsets", () => {
  const source = 'Console.WriteLine("A sucedido un error");';
  const literals = extractGenericLiterals("csharp", source);
  assert.equal(literals.length, 1);
  assert.equal(literals[0]!.text, "A sucedido un error");
  assert.equal(source.slice(literals[0]!.start, literals[0]!.end), "A sucedido un error");
});

test("csharp: ignora strings dentro de comentarios de línea y de bloque", () => {
  const source = [
    '// var x = "comentado de línea";',
    "/* var y = \"comentado de bloque\"; */",
    'var real = "Guardar cambios";',
  ].join("\n");
  assert.deepEqual(texts("csharp", source), ["Guardar cambios"]);
});

test("python: usa # como comentario de línea", () => {
  const source = ['# saludo = "no cuenta"', 'saludo = "Hola mundo"'].join("\n");
  assert.deepEqual(texts("python", source), ["Hola mundo"]);
});

test("go: strings con backtick pueden ser multilínea", () => {
  const source = "const s = `línea uno\nlínea dos`";
  assert.deepEqual(texts("go", source), ["línea uno\nlínea dos"]);
});

test("ignora el argumento de import/require/include/use", () => {
  const source = [
    'import "fmt"', // go
    'require "json"', // ruby
    'include "config.php"', // estilo php/c
    'use "std::io"', // estilo rust (ilustrativo)
  ].join("\n");
  assert.deepEqual(texts("go", source), []);
});

test("no revienta con comillas sin cerrar al final del archivo", () => {
  assert.deepEqual(texts("csharp", 'var s = "sin cerrar'), []);
});

test("lenguaje no soportado devuelve una lista vacía", () => {
  assert.deepEqual(extractGenericLiterals("cobol", 'DISPLAY "hola".'), []);
});
