import assert from "node:assert/strict";
import { test } from "node:test";
import { extractLiterals } from "./extract.js";

function texts(fileName: string, source: string): string[] {
  return extractLiterals(fileName, source).literals.map((l) => l.text);
}

test("extrae strings simples y respeta offsets sin comillas", () => {
  const source = `const error = "A sucedido un error";`;
  const { literals } = extractLiterals("demo.ts", source);
  assert.equal(literals.length, 1);
  assert.equal(literals[0]!.text, "A sucedido un error");
  assert.equal(source.slice(literals[0]!.start, literals[0]!.end), "A sucedido un error");
});

test("extrae los trozos de texto de un template literal, no las interpolaciones", () => {
  const source = "const s = `El usuaro ${name} no tiene permisos`;";
  const found = texts("demo.ts", source);
  assert.deepEqual(found, ["El usuaro ", " no tiene permisos"]);
});

test("extrae JsxText pero no atributos técnicos", () => {
  const source = `const el = <button className="btn-primary" title="Cerrar sesión">Guardar cambios</button>;`;
  const found = texts("demo.tsx", source);
  assert.deepEqual(found, ["Cerrar sesión", "Guardar cambios"]);
});

test("ignora imports, require, dynamic import y claves de process.env", () => {
  const source = [
    `import UserService from "./UserService";`,
    `const fs = require("node:fs");`,
    `const mod = import("./lazy");`,
    `const key = process.env["API_URL"];`,
  ].join("\n");
  assert.deepEqual(texts("demo.ts", source), []);
});

test("ignora claves de objeto pero conserva los valores", () => {
  const source = `export default { "save-label": "Guardar cambios" };`;
  assert.deepEqual(texts("demo.ts", source), ["Guardar cambios"]);
});
