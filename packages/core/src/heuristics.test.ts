import assert from "node:assert/strict";
import { test } from "node:test";
import { looksLikeHumanLanguage } from "./heuristics.js";

test("acepta frases con espacios", () => {
  assert.equal(looksLikeHumanLanguage("Guardar cambios"), true);
  assert.equal(looksLikeHumanLanguage("El usuaro no tiene permissos"), true);
  assert.equal(looksLikeHumanLanguage("¿Desea continuar?"), true);
});

test("acepta palabras sueltas con pinta de idioma natural", () => {
  assert.equal(looksLikeHumanLanguage("Error"), true);
  assert.equal(looksLikeHumanLanguage("Cargando"), true);
});

test("rechaza identificadores de código", () => {
  assert.equal(looksLikeHumanLanguage("userRepository"), false);
  assert.equal(looksLikeHumanLanguage("saveUserData"), false);
  assert.equal(looksLikeHumanLanguage("UserRepository"), false);
  assert.equal(looksLikeHumanLanguage("JWT_TOKEN"), false);
  assert.equal(looksLikeHumanLanguage("user-profile"), false);
});

test("rechaza rutas, URLs, emails, claves i18n y vacíos", () => {
  assert.equal(looksLikeHumanLanguage("api/v1/users"), false);
  assert.equal(looksLikeHumanLanguage("https://example.com"), false);
  assert.equal(looksLikeHumanLanguage("a@b.com"), false);
  assert.equal(looksLikeHumanLanguage("errors.auth.invalid"), false);
  assert.equal(looksLikeHumanLanguage(""), false);
  assert.equal(looksLikeHumanLanguage("   "), false);
});

test("rechaza acrónimos cortos en mayúsculas", () => {
  assert.equal(looksLikeHumanLanguage("JWT"), false);
  assert.equal(looksLikeHumanLanguage("API"), false);
});

test("respeta knownIdentifiers aunque el texto tenga espacios", () => {
  const knownIdentifiers = new Set(["user repository"]);
  assert.equal(looksLikeHumanLanguage("user repository", { knownIdentifiers }), false);
});
