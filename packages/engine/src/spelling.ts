import nspell from "nspell";
import type { CorrectionIssue } from "@langcorrector/core";

const WORD = /\p{L}[\p{L}\p{M}'-]*/gu;
const MAX_SUGGESTIONS = 5;

export type SpellChecker = (text: string) => CorrectionIssue[];

export interface SpellCheckerOptions {
  /** Ver {@link LanguagePackManifest.silentPrefixes} en @langcorrector/pack-loader. */
  silentPrefixes?: readonly string[];
}

/** El subconjunto de la API de nspell que usamos — evita acoplar el resto del módulo al tipo exacto de la librería. */
interface Dictionary {
  correct(word: string): boolean;
  suggest(word: string): string[];
}

/**
 * Construye un corrector ortográfico a partir de un diccionario Hunspell
 * (aff/dic) usando `nspell` — el propio motor de LibreOffice/Firefox
 * reimplementado en JS puro, sin binarios nativos. Construir la instancia
 * tiene un coste (parsea ~58k entradas + sus reglas de afijos), así que se
 * hace UNA vez por pack, no por documento analizado.
 */
export function createSpellChecker(aff: string, dic: string, options: SpellCheckerOptions = {}): SpellChecker {
  const dictionary: Dictionary = nspell(aff, dic);
  const silentPrefixes = options.silentPrefixes ?? [];

  return function checkSpelling(text: string): CorrectionIssue[] {
    const issues: CorrectionIssue[] = [];

    for (const match of text.matchAll(WORD)) {
      const word = match[0];
      if (dictionary.correct(word)) continue;

      const silentPrefixFix = findSilentPrefixFix(word, dictionary, silentPrefixes);
      const suggestions = rankSuggestions(word, dictionary.suggest(word), silentPrefixFix).slice(0, MAX_SUGGESTIONS);
      if (suggestions.length === 0) continue; // sin sugerencia: probablemente un nombre propio o término técnico, no molestamos

      const start = match.index;
      issues.push({
        start,
        end: start + word.length,
        message: `Posible error ortográfico: "${word}" → "${suggestions[0]}".`,
        suggestions,
        rule: "spelling",
      });
    }

    return issues;
  };
}

/**
 * nspell no siempre pone primera la sugerencia más natural. Dos casos que
 * arreglamos explícitamente, en vez de confiar en su ranking genérico:
 *
 * 1. **Tilde**: para "sesion" o "Conexion" (falta solo la tilde) antepone
 *    formas verbales como "sesiona"/"Conexiona" — misma distancia de
 *    edición, pero cambia de palabra — y dejaba la forma con tilde correcta
 *    al final de la lista, donde el límite de sugerencias la cortaba.
 * 2. **Prefijo silencioso** (`extraFirst`, ver {@link findSilentPrefixFix}):
 *    para "acer" pone "hacer" en la posición 10, y para "oy", "hoy" en la
 *    15 — muy por fuera de cualquier límite razonable de sugerencias.
 *
 * Ninguna sugerencia de nspell se descarta — solo se reordena.
 */
export function rankSuggestions(word: string, suggestions: readonly string[], extraFirst?: string): string[] {
  const base = stripDiacritics(word);
  const accentFixes = suggestions.filter((s) => stripDiacritics(s) === base);
  const rest = suggestions.filter((s) => stripDiacritics(s) !== base);
  const ranked = [...accentFixes, ...rest];

  if (!extraFirst) return ranked;
  const withoutDuplicate = ranked.filter((s) => s.toLowerCase() !== extraFirst.toLowerCase());
  return [extraFirst, ...withoutDuplicate];
}

/**
 * La H es siempre muda en español (y algo parecido pasa en otros idiomas
 * con otras letras — de ahí que esto sea configurable por pack vía
 * `silentPrefixes`, no un caso hardcodeado aquí), así que se "cae" al
 * escribir rápido con mucha frecuencia. Si anteponer uno de estos prefijos
 * a la palabra da como resultado una palabra válida del diccionario, esa es
 * casi siempre la corrección que se buscaba.
 */
function findSilentPrefixFix(word: string, dictionary: Dictionary, prefixes: readonly string[]): string | undefined {
  const lowerWord = word.toLowerCase();
  for (const prefix of prefixes) {
    if (lowerWord.startsWith(prefix.toLowerCase())) continue; // ya lo tiene, no aplica
    const candidate = prefix.toLowerCase() + lowerWord;
    if (dictionary.correct(candidate)) return matchCase(word, candidate);
  }
  return undefined;
}

/** Aplica el patrón de mayúsculas de `source` (MAYÚSCULA / Capitalizada / minúscula) a `replacement`. */
function matchCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return replacement.toUpperCase();
  }
  const firstChar = source[0] ?? "";
  if (firstChar && firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
    return (replacement[0] ?? "").toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function stripDiacritics(word: string): string {
  return word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
