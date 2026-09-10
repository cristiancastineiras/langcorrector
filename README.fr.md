<p align="center"><img src="./assets/banner.png" alt="LangCorrector" width="480"></p>

<p align="center">
  <a href="./README.md">Español</a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.fr.md"><b>Français</b></a> ·
  <a href="./README.de.md">Deutsch</a>
</p>

> Corrige la langue. Pas ton code.

Une extension VS Code qui corrige le **langage naturel** dans le code source
(chaînes de caractères, JSX, logs, i18n) sans toucher aux variables,
fonctions, classes ni noms de fichiers. Disponible en **espagnol, anglais,
français et allemand**.


## Structure du monorepo

```
.
├── extensions/
│   └── langcorrector/     La seule extension VS Code. Charge le pack de la
│                          langue configurée (langcorrector.language).
├── packages/
│   ├── core/               @langcorrector/core — indépendant de la langue :
│   │                       extraction des littéraux via l'AST + heuristique
│   │                       « est-ce du langage humain ? ».
│   ├── engine/              @langcorrector/engine — le SEUL moteur de
│   │                       correction : interprète un pack de langue
│   │                       (Hunspell via nspell + règles de grammaire en
│   │                       JSON) et implémente LanguageCorrector.
│   ├── pack-loader/         @langcorrector/pack-loader — format de pack
│   │                       (pack.json) + résolution locale et distante
│   │                       (téléchargement + cache + somme de contrôle
│   │                       depuis un registry, pensé pour GitHub Releases).
│   ├── pack-es/             Espagnol — Hunspell es_ES (LibreOffice, MPL-1.1).
│   ├── pack-en/             Anglais — Hunspell en_US (SCOWL, permissive).
│   ├── pack-fr/             Français — Hunspell fr (LibreOffice, MPL-2.0).
│   └── pack-de/             Allemand — Hunspell de_DE_frami (LibreOffice, LGPL-2.1).
│                            (pack-xx = DONNÉES : dictionnaire + phrase-rules.json, pas de code)
├── assets/                 logo.svg (source) + banner.png (généré).
├── .changeset/             Versionnage et changelog par paquet.
├── .github/workflows/      CI : typecheck + lint + build + test à chaque PR.
├── turbo.json              Pipeline de tâches (build/dev/typecheck/lint/test).
├── .oxlintrc.json           Config oxlint (lint de tout le monorepo).
├── tsconfig.base.json       Options TypeScript communes.
└── pnpm-workspace.yaml
```

### Pourquoi cette forme

Une seule extension (pas une par langue) au-dessus d'un moteur générique qui
interprète des **packs de langue** — des données (dictionnaire + règles),
jamais du code exécuté à l'exécution. Ajouter une langue, c'est :

1. `packages/pack-xx/` — un `.aff`/`.dic` Hunspell (ou équivalent) +
   `phrase-rules.json`. Zéro TypeScript.
2. Une ligne dans `extensions/langcorrector/scripts/build.mjs` pour
   l'embarquer (ou, plus tard, le publier comme asset d'une GitHub Release
   et laisser `@langcorrector/pack-loader` le télécharger à la demande).



### Une remarque honnête sur les dictionnaires

Chaque dictionnaire Hunspell vient de
[LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries) (voir
`NOTICE.md` dans chaque `packages/pack-xx/`) — on n'a pas embarqué toutes les
langues que ce dépôt propose. **Le portugais (`pt_BR` et `pt_PT`) a été
abandonné** : son dictionnaire fait planter `nspell` (>1,5 Go de RAM, ne
converge jamais) au lieu des quelques secondes normales pour les autres
langues. Il n'est pas dans l'énumération `langcorrector.language` tant que ce
n'est pas résolu avec une autre source de dictionnaire ou un autre moteur.

## Démarrer

```sh
pnpm install
pnpm build        # compile core/engine/pack-loader et bundle l'extension
pnpm test         # tests de packages/* (vérifie aussi les sommes de contrôle de chaque pack)
pnpm typecheck
pnpm lint         # oxlint
```

Pour tester l'extension dans un Extension Development Host : ouvre ce
dossier dans VS Code et appuie sur **F5** (voir
[.vscode/launch.json](./.vscode/launch.json) et
[extensions/langcorrector/README.md](./extensions/langcorrector/README.md)).

## Scripts du workspace

| Script | Ce qu'il fait |
| --- | --- |
| `pnpm build` | Build de tous les paquets (Turborepo, avec cache). |
| `pnpm dev` | Watch mode de tous les paquets en parallèle. |
| `pnpm typecheck` / `pnpm lint` | Sur tout le monorepo. |
| `pnpm test` | Tests de tous les paquets. |
| `pnpm package` | Build + génère le `.vsix` de `langcorrector`. |
| `pnpm changeset` | Enregistre un changement pour le prochain release. |


