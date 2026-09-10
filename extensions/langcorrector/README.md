<p align="center"><img src="../../assets/banner.png" alt="LangCorrector" width="400"></p>

# LangCorrector

Corrige el lenguaje humano dentro de tu código (strings, JSX, logs) — sin
tocar nombres de variables, funciones, clases ni imports. Funciona en
TypeScript/JSX/JavaScript (con AST real) y en C#, Java, Kotlin, Go, Rust, C,
C++, Swift, Dart, PHP, Python y Ruby (con un extractor genérico).

## Qué hace

1. Localiza strings en el archivo abierto: con el AST real de TypeScript
   (`@langcorrector/core`, para .ts/.tsx/.js/.jsx — strings, template
   literals, texto JSX y atributos JSX "de texto" como `title`,
   `placeholder`, `alt`, `aria-label`, `aria-description`), o con un
   tokenizer genérico consciente de comillas y comentarios para el resto de
   lenguajes soportados (ver `packages/core/src/genericExtract.ts`).
2. Filtra con una heurística determinista si ese texto parece lenguaje humano
   o parece código (identificador, ruta, URL, clave i18n...).
3. Lo que sobrevive pasa por `@langcorrector/engine`, que corrige ortografía
   (Hunspell real vía `nspell`) y gramática (reglas de patrón) usando los
   datos del **pack de idioma** configurado — español, inglés, francés o
   alemán (`@langcorrector/pack-es|en|fr|de`), los cuatro bundleados con la
   extensión.
4. Cada hallazgo aparece como diagnóstico (subrayado) con uno o varios Quick
   Fix (`Ctrl+.`) que reemplazan solo el texto marcado — varios porque
   nspell no siempre ordena "la sugerencia más natural" primera (ver
   `packages/engine/src/spelling.ts`), así que se ofrecen varias en vez de
   forzar una sola.

> Cargar el pack (parsear el Hunspell del idioma activo) tiene un coste de
> arranque **una sola vez por activación** de la extensión, no por cada
> archivo analizado — pero varía mucho según el idioma: es ~1s, en ~0.3s,
> fr ~5-6s, de ~5s (afijos alemanes/franceses mucho más numerosos). No es
> instantáneo en todos los casos; lo documentamos en vez de prometer algo
> que no es cierto para todos los idiomas.


## Probarla en local

Desde la raíz del monorepo:

```sh
pnpm install
pnpm --filter langcorrector build
```

Luego abre la raíz del monorepo en VS Code y pulsa **F5** (configuración
"Ejecutar LangCorrector" en `.vscode/launch.json`). Se abre una ventana de
Extension Development Host con `extensions/langcorrector/sample/` como
carpeta — abre `demo.ts` o `demo.tsx` para ver los diagnósticos en directo
(en español, el pack por defecto). Para probar otro idioma, en esa ventana
de prueba cambia `langcorrector.language` a `"en"`/`"fr"`/`"de"` en Settings
y escribe algo en ese idioma con una errata.

## Configuración

| Setting | Default | Descripción |
| --- | --- | --- |
| `langcorrector.enable` | `true` | Activa/desactiva el análisis. |
| `langcorrector.language` | `"es"` | Pack de idioma a usar: `"es"`, `"en"`, `"fr"` o `"de"`. |
| `langcorrector.mode` | `"ui"` | Único modo implementado en v0 (strings + JSX + i18n). |
| `langcorrector.packRegistryUrl` | `""` | Base URL de un registry remoto de packs (p. ej. assets de una GitHub Release) para idiomas no bundleados. Vacío = solo packs locales. |

> Portugués se intentó y se descartó de v0: tanto `pt_BR` como `pt_PT`
> (los dos diccionarios Hunspell de LibreOffice/dictionaries) hacen que
> `nspell` se cuelgue en vez de cargar en segundos, como el resto de
> idiomas. Ver la nota en el [README raíz](../../README.md#un-aviso-honesto-sobre-los-diccionarios).

## Cambiar de idioma

Por defecto corrige en **español**. Para cambiarlo (por ejemplo a inglés):

1. `Ctrl+,` para abrir Settings (o `Ctrl+Shift+P` → *Preferences: Open Settings (UI)*).
2. Busca **`langcorrector`**.
3. Cambia **`langcorrector.language`** de `es` a `en` (también `fr` o `de`).

Se aplica al momento — no hace falta recargar la ventana. También puedes
editarlo directamente en tu `settings.json`:

```json
{
  "langcorrector.language": "en"
}
```

Dos cosas a tener en cuenta:

- Es **un idioma a la vez** para toda la ventana de VS Code, no por archivo
  — no detecta automáticamente el idioma de cada proyecto/documento. Si
  trabajas con código en varios idiomas a la vez, cambia el setting según
  en cuál estés.
- Al cambiar de idioma, la extensión carga el diccionario de ese idioma
  desde cero (coste de arranque único, no por archivo — ver tabla más
  arriba: ~0.3s en inglés, ~5-6s en francés/alemán).

## Empaquetar

```sh
pnpm --filter langcorrector package
```

Genera un `.vsix` en `extensions/langcorrector/`. Antes de publicar de
verdad: cambia `publisher` y `repository.url` (ahora son placeholders) en
[package.json](./package.json).

## Estructura

```
src/
  extension.ts   activación: resuelve el pack, hace wiring de eventos de VS Code
  packs.ts        resuelve el pack configurado (local bundleado, o remoto si hay registry)
  scan.ts         extracción + heurística + corrección -> vscode.Diagnostic[]
  codeActions.ts  Quick Fix (CodeActionProvider)
sample/            archivos de prueba manual para F5
scripts/build.mjs  bundler (esbuild) + copia dist/packs/<locale>/ sin transformar
```
