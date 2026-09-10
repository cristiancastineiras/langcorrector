import type { CorrectionIssue } from "@langcorrector/core";
import type { PhraseRuleDefinition } from "@langcorrector/pack-loader";

export type PhraseRuleChecker = (text: string) => CorrectionIssue[];

/**
 * Compila las reglas de gramática de un pack (JSON, ver
 * `@langcorrector/pack-loader`) en un checker. Son reglas de PATRÓN, no de
 * palabra suelta — p. ej. la confusión "a"/"ha" delante de un participio,
 * que `spelling.ts` nunca detectaría (ambas son palabras válidas por sí
 * solas).
 */
export function createPhraseRuleChecker(rules: readonly PhraseRuleDefinition[]): PhraseRuleChecker {
  const compiled = rules.map((rule) => ({ rule, regex: new RegExp(rule.pattern, ensureGlobalFlag(rule.flags)) }));

  return function checkPhraseRules(text: string): CorrectionIssue[] {
    const issues: CorrectionIssue[] = [];

    for (const { rule, regex } of compiled) {
      // ensureGlobalFlag() ya garantiza regex.global === true, así que este
      // bucle siempre avanza (regex.exec con "g" mueve regex.lastIndex solo):
      // no hace falta protegerse aquí de un bucle infinito.
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text))) {
        issues.push({
          start: match.index,
          end: match.index + match[0].length,
          message: applyTemplate(rule.message, match),
          suggestions: [applyTemplate(rule.replacement, match)],
          rule: rule.id,
        });
      }
    }

    return issues;
  };
}

function ensureGlobalFlag(flags: string): string {
  return flags.includes("g") ? flags : `${flags}g`;
}

function applyTemplate(template: string, match: RegExpExecArray): string {
  return template.replace(/\$(\d+)/g, (_full, group: string) => match[Number(group)] ?? "");
}
