<p align="center"><img src="./assets/banner.png" alt="LangCorrector" width="480"></p>

<p align="center">
  <a href="./README.md"><b>Español</b></a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.fr.md">Français</a> ·
  <a href="./README.de.md">Deutsch</a>
</p>

> Corrige el idioma. No tu código.

Una extensión de VS Code que corrige el **lenguaje natural** dentro del
código fuente (strings, JSX, logs, i18n) sin tocar variables, funciones,
clases ni nombres de archivo. Incluye **español, inglés, francés y alemán**.

- **[extensions/langcorrector/GUIA.md](./extensions/langcorrector/GUIA.md)** — cómo instalarla y usarla, paso a paso (empieza aquí si solo quieres probarla).

## Estructura del monorepo

```
.
├── extensions/
│   └── langcorrector/     La única extensión de VS Code. Carga el pack del
│                          idioma configurado (langcorrector.language).
├── packages/
│   ├── core/               @langcorrector/core — independiente del idioma:
│   │                       extracción de literales por AST + heurística de
│   │                       "¿esto es lenguaje humano?".
│   ├── engine/              @langcorrector/engine — el ÚNICO motor de
│   │                       corrección: interpreta un pack de idioma
│   │                       (Hunspell vía nspell + reglas de gramática en
│   │                       JSON) e implementa LanguageCorrector.
│   ├── pack-loader/         @langcorrector/pack-loader — formato de pack
│   │                       (pack.json) + resolución local y remota
│   │                       (descarga + caché + checksum desde un registry,
│   │                       pensado para GitHub Releases).
│   ├── pack-es/             Español — Hunspell es_ES (LibreOffice, MPL-1.1).
│   ├── pack-en/             English — Hunspell en_US (SCOWL, permisiva).
│   ├── pack-fr/             Français — Hunspell fr (LibreOffice, MPL-2.0).
│   └── pack-de/             Deutsch — Hunspell de_DE_frami (LibreOffice, LGPL-2.1).
│                            (pack-xx = DATOS: diccionario + phrase-rules.json, no código)
├── assets/                 logo.svg (fuente) + banner.png (generado).
├── .changeset/             Versionado y changelog por paquete.
├── .github/workflows/      CI: typecheck + lint + build + test en cada PR.
├── turbo.json              Pipeline de tareas (build/dev/typecheck/lint/test).
├── .oxlintrc.json           Config de oxlint (lint del monorepo).
├── tsconfig.base.json       Opciones de TypeScript comunes.
└── pnpm-workspace.yaml
```

### Por qué esta forma

Una única extensión (no una por idioma) sobre un motor genérico que
interpreta **packs de idioma** — datos (diccionario + reglas), nunca código
ejecutado en runtime. Añadir un idioma nuevo es:

1. `packages/pack-xx/` — un `.aff`/`.dic` Hunspell (o equivalente) +
   `phrase-rules.json`. Cero TypeScript.
2. Una línea en `extensions/langcorrector/scripts/build.mjs` para bundlearlo
   (o, más adelante, publicarlo como asset de una GitHub Release y dejar que
   `@langcorrector/pack-loader` lo descargue on-demand).


### Un aviso honesto sobre los diccionarios

Cada diccionario Hunspell viene de [LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries)
(ver `NOTICE.md` en cada `packages/pack-xx/`) — no probamos todos los
idiomas que ese repositorio ofrece: **portugués (`pt_BR` y `pt_PT`) se
descartó** porque su diccionario hace que `nspell` se quede colgado (>1.5 GB
de RAM, no converge) en vez de tardar los pocos segundos normales del resto
de idiomas. No está en el enum de `langcorrector.language` hasta que se
resuelva con otra fuente de diccionario u otro motor.

## Empezar

```sh
pnpm install
pnpm build        # compila core/engine/pack-loader y bundlea la extensión
pnpm test         # tests de packages/* (incluye verificar checksums de cada pack)
pnpm typecheck
pnpm lint         # oxlint
```

Para probar la extensión en un Extension Development Host: abre esta carpeta
en VS Code y pulsa **F5** (ver [.vscode/launch.json](./.vscode/launch.json)
y [extensions/langcorrector/README.md](./extensions/langcorrector/README.md)).

## Scripts del workspace

| Script | Qué hace |
| --- | --- |
| `pnpm build` | Build de todos los paquetes (Turborepo, con caché). |
| `pnpm dev` | Watch mode de todos los paquetes en paralelo. |
| `pnpm typecheck` / `pnpm lint` | Sobre todo el monorepo. |
| `pnpm test` | Tests de todos los paquetes. |
| `pnpm package` | Build + genera el `.vsix` de `langcorrector`. |
| `pnpm changeset` | Registra un cambio para el próximo release. |

