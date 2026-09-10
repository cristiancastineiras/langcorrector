# Changelog — LangCorrector

Este archivo sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Los releases reales se gestionan con [changesets](../../.changeset/README.md).

## [Unreleased]

### Changed

- Reestructurado de "una extensión por idioma" a **una extensión + motor
  genérico + packs de idioma** (datos, no código).
- El motor de ortografía pasa de un diccionario propio de ~50 palabras a
  Hunspell real (`nspell` + el diccionario es_ES de
  [LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries),
  MPL-1.1 — ver `packages/pack-es/NOTICE.md`).
- ESLint sustituido por [oxlint](https://oxc.rs/).

### Added

- Extracción de literales por AST (strings, template literals, JSX, valores
  de objeto) vía `@langcorrector/core` para TS/TSX/JS/JSX, y un extractor
  genérico (comillas + comentarios, sin AST) para C#, Java, Kotlin, Go,
  Rust, C, C++, Swift, Dart, PHP, Python y Ruby.
- Packs de inglés, francés y alemán, además de español (`@langcorrector/pack-en|fr|de|es`).
- Reglas de puntuación a nivel de frase (no solo palabra suelta): ¿…?/¡…!
  cuando falta el signo de apertura (español), espacio doble, espacio que
  falta tras coma/punto y coma/dos puntos.
- `silentPrefixes` en el pack: para español, detecta y prioriza la
  corrección cuando se "cae" la H muda ("acer" → "hacer", "oy" → "hoy") —
  nspell la encontraba, pero muy abajo en su propio ranking (p. ej. posición
  10 y 15 respectivamente); ahora se antepone explícitamente.
- Heurística determinista de "¿esto es lenguaje humano?".
- `@langcorrector/pack-loader`: resolución de packs locales + descarga y
  caché con verificación de checksum desde un registry remoto (aún sin
  registry real desplegado).
- Diagnósticos en vivo y Quick Fix (uno por sugerencia, no solo la primera)
  por cada hallazgo.

### Fixed

- `activationEvents` solo incluía TS/TSX/JS/JSX: la extensión no se
  activaba en absoluto al abrir un archivo de cualquier otro lenguaje
  soportado (p. ej. C#), aunque el extractor genérico ya los soportara.
