<p align="center"><img src="./assets/banner.png" alt="LangCorrector" width="480"></p>

<p align="center">
  <a href="./README.md">Español</a> ·
  <a href="./README.en.md"><b>English</b></a> ·
  <a href="./README.fr.md">Français</a> ·
  <a href="./README.de.md">Deutsch</a>
</p>

> Fix the language. Not your code.

A VS Code extension that corrects the **natural-language** text inside your
source code (strings, JSX, logs, i18n) without touching variables,
functions, classes, or file names. Ships with **Spanish, English, French,
and German**.

## Monorepo layout

```
.
├── extensions/
│   └── langcorrector/     The one VS Code extension. Loads the pack for the
│                          configured language (langcorrector.language).
├── packages/
│   ├── core/               @langcorrector/core — language-agnostic: AST
│   │                       literal extraction + the "is this human
│   │                       language?" heuristic.
│   ├── engine/              @langcorrector/engine — the ONE correction
│   │                       engine: interprets a language pack (Hunspell via
│   │                       nspell + JSON grammar rules) and implements
│   │                       LanguageCorrector.
│   ├── pack-loader/         @langcorrector/pack-loader — pack format
│   │                       (pack.json) + local and remote resolution
│   │                       (download + cache + checksum from a registry,
│   │                       meant for GitHub Releases).
│   ├── pack-es/             Spanish — Hunspell es_ES (LibreOffice, MPL-1.1).
│   ├── pack-en/             English — Hunspell en_US (SCOWL, permissive).
│   ├── pack-fr/             French — Hunspell fr (LibreOffice, MPL-2.0).
│   └── pack-de/             German — Hunspell de_DE_frami (LibreOffice, LGPL-2.1).
│                            (pack-xx = DATA: dictionary + phrase-rules.json, no code)
├── assets/                 logo.svg (source) + banner.png (generated).
├── .changeset/             Per-package versioning and changelog.
├── .github/workflows/      CI: typecheck + lint + build + test on every PR.
├── turbo.json              Task pipeline (build/dev/typecheck/lint/test).
├── .oxlintrc.json           oxlint config (monorepo-wide lint).
├── tsconfig.base.json       Shared TypeScript options.
└── pnpm-workspace.yaml
```

### Why this shape

One single extension (not one per language) on top of a generic engine that
interprets **language packs** — data (dictionary + rules), never code
executed at runtime. Adding a new language means:

1. `packages/pack-xx/` — a Hunspell `.aff`/`.dic` (or equivalent) +
   `phrase-rules.json`. Zero TypeScript.
2. One line in `extensions/langcorrector/scripts/build.mjs` to bundle it (or,
   later, publish it as a GitHub Release asset and let
   `@langcorrector/pack-loader` fetch it on demand).



### An honest note about the dictionaries

Every Hunspell dictionary comes from
[LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries) (see
`NOTICE.md` in each `packages/pack-xx/`) — we didn't ship every language that
repository offers. **Portuguese (`pt_BR` and `pt_PT`) was dropped**: its
dictionary makes `nspell` hang (>1.5 GB RAM, never converges) instead of the
few seconds every other language takes to load. It's not in the
`langcorrector.language` enum until this is solved with a different
dictionary source or engine.

## Getting started

```sh
pnpm install
pnpm build        # builds core/engine/pack-loader and bundles the extension
pnpm test         # packages/* tests (includes verifying each pack's checksums)
pnpm typecheck
pnpm lint         # oxlint
```

To try the extension in an Extension Development Host: open this folder in
VS Code and press **F5** (see [.vscode/launch.json](./.vscode/launch.json)
and [extensions/langcorrector/README.md](./extensions/langcorrector/README.md)).

## Workspace scripts

| Script | What it does |
| --- | --- |
| `pnpm build` | Builds every package (Turborepo, cached). |
| `pnpm dev` | Watch mode for every package in parallel. |
| `pnpm typecheck` / `pnpm lint` | Across the whole monorepo. |
| `pnpm test` | Every package's tests. |
| `pnpm package` | Build + produces `langcorrector`'s `.vsix`. |
| `pnpm changeset` | Records a change for the next release. |

