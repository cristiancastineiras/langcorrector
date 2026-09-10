<p align="center"><img src="./assets/banner.png" alt="LangCorrector" width="480"></p>

<p align="center">
  <a href="./README.md">Español</a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.fr.md">Français</a> ·
  <a href="./README.de.md"><b>Deutsch</b></a>
</p>

> Korrigiert die Sprache. Nicht deinen Code.

Eine VS-Code-Erweiterung, die **natürliche Sprache** innerhalb des
Quellcodes korrigiert (Strings, JSX, Logs, i18n) — ohne Variablen,
Funktionen, Klassen oder Dateinamen anzufassen. Enthält **Spanisch,
Englisch, Französisch und Deutsch**.


## Aufbau des Monorepos

```
.
├── extensions/
│   └── langcorrector/     Die einzige VS-Code-Erweiterung. Lädt das Pack
│                          der konfigurierten Sprache (langcorrector.language).
├── packages/
│   ├── core/               @langcorrector/core — sprachunabhängig:
│   │                       AST-Extraktion von Literalen + die Heuristik
│   │                       „ist das menschliche Sprache?".
│   ├── engine/              @langcorrector/engine — die EINE Korrektur-
│   │                       Engine: interpretiert ein Sprachpack (Hunspell
│   │                       via nspell + Grammatikregeln als JSON) und
│   │                       implementiert LanguageCorrector.
│   ├── pack-loader/         @langcorrector/pack-loader — Pack-Format
│   │                       (pack.json) + lokale und entfernte Auflösung
│   │                       (Download + Cache + Prüfsumme von einer
│   │                       Registry, gedacht für GitHub Releases).
│   ├── pack-es/             Spanisch — Hunspell es_ES (LibreOffice, MPL-1.1).
│   ├── pack-en/             Englisch — Hunspell en_US (SCOWL, freizügig).
│   ├── pack-fr/             Französisch — Hunspell fr (LibreOffice, MPL-2.0).
│   └── pack-de/             Deutsch — Hunspell de_DE_frami (LibreOffice, LGPL-2.1).
│                            (pack-xx = DATEN: Wörterbuch + phrase-rules.json, kein Code)
├── assets/                 logo.svg (Quelle) + banner.png (generiert).
├── .changeset/             Versionierung und Changelog pro Paket.
├── .github/workflows/      CI: typecheck + lint + build + test bei jedem PR.
├── turbo.json              Task-Pipeline (build/dev/typecheck/lint/test).
├── .oxlintrc.json           oxlint-Konfiguration (Lint fürs ganze Monorepo).
├── tsconfig.base.json       Gemeinsame TypeScript-Optionen.
└── pnpm-workspace.yaml
```

### Warum diese Form

Eine einzige Erweiterung (nicht eine pro Sprache) über einer generischen
Engine, die **Sprachpacks** interpretiert — Daten (Wörterbuch + Regeln), nie
zur Laufzeit ausgeführter Code. Eine neue Sprache hinzuzufügen heißt:

1. `packages/pack-xx/` — eine Hunspell-`.aff`/`.dic`-Datei (oder
   Äquivalent) + `phrase-rules.json`. Null TypeScript.
2. Eine Zeile in `extensions/langcorrector/scripts/build.mjs`, um es zu
   bundlen (oder später als GitHub-Release-Asset zu veröffentlichen und
   `@langcorrector/pack-loader` es bei Bedarf herunterladen zu lassen).

Weder `packages/core` noch `packages/engine` ändern sich. Vollständige
Begründung (auf Spanisch) in

### Ein ehrlicher Hinweis zu den Wörterbüchern

Jedes Hunspell-Wörterbuch stammt von
[LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries)
(siehe `NOTICE.md` in jedem `packages/pack-xx/`) — wir haben nicht jede dort
verfügbare Sprache eingebaut. **Portugiesisch (`pt_BR` und `pt_PT`) wurde
verworfen**: dessen Wörterbuch bringt `nspell` zum Hängen (>1,5 GB RAM,
konvergiert nie) statt der wenigen Sekunden, die jede andere Sprache
braucht. Es steht nicht in der `langcorrector.language`-Aufzählung, bis das
mit einer anderen Wörterbuchquelle oder Engine gelöst ist.

## Loslegen

```sh
pnpm install
pnpm build        # baut core/engine/pack-loader und bundelt die Erweiterung
pnpm test         # Tests von packages/* (prüft auch die Prüfsummen jedes Packs)
pnpm typecheck
pnpm lint         # oxlint
```

Um die Erweiterung in einem Extension Development Host auszuprobieren:
diesen Ordner in VS Code öffnen und **F5** drücken (siehe
[.vscode/launch.json](./.vscode/launch.json) und
[extensions/langcorrector/README.md](./extensions/langcorrector/README.md)).

## Workspace-Skripte

| Skript | Was es macht |
| --- | --- |
| `pnpm build` | Build aller Pakete (Turborepo, mit Cache). |
| `pnpm dev` | Watch-Modus für alle Pakete parallel. |
| `pnpm typecheck` / `pnpm lint` | Für das ganze Monorepo. |
| `pnpm test` | Tests aller Pakete. |
| `pnpm package` | Build + erzeugt die `.vsix` von `langcorrector`. |
| `pnpm changeset` | Trägt eine Änderung für den nächsten Release ein. |


