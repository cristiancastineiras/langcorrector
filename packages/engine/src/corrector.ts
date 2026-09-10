import type { CorrectionIssue, LanguageCorrector } from "@langcorrector/core";
import type { LoadedLanguagePack } from "@langcorrector/pack-loader";
import { createPhraseRuleChecker } from "./phraseRules.js";
import { createSpellChecker } from "./spelling.js";

/**
 * El único `LanguageCorrector` que existe en LangCorrector: no hay una
 * implementación por idioma, hay UN motor (ortografía vía Hunspell/nspell +
 * reglas de gramática por patrón) que se parametriza con los datos de un
 * pack. Añadir un idioma nuevo no toca este archivo.
 */
export function createLanguageCorrector(pack: LoadedLanguagePack): LanguageCorrector {
  const checkSpelling = createSpellChecker(pack.aff, pack.dic, { silentPrefixes: pack.manifest.silentPrefixes });
  const checkPhraseRules = createPhraseRuleChecker(pack.phraseRules);

  return {
    locale: pack.manifest.locale,
    check(text: string): CorrectionIssue[] {
      const issues: CorrectionIssue[] = [...checkPhraseRules(text), ...checkSpelling(text)];
      return issues.sort((a, b) => a.start - b.start);
    },
  };
}
