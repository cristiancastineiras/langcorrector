/**
 * Extracción de strings para lenguajes que NO son TS/JS/JSX (donde sí
 * usamos el compilador de TypeScript vía `extract.ts` para máxima
 * precisión). Aquí no hay AST: es un tokenizer de un solo paso, consciente
 * de comentarios y comillas, configurado por lenguaje — suficiente para
 * encontrar literales de cadena sin arrastrar un parser distinto por cada
 * lenguaje.
 *
 * Es deliberadamente más simple (y con más falsos positivos/negativos
 * posibles) que `extract.ts`: no distingue import/require de forma tan fina,
 * no conoce identificadores declarados. La heurística de humanidad
 * (`heuristics.ts`) hace la mayor parte del trabajo de filtrado igualmente.
 */
import type { ExtractedLiteral } from "./types.js";

export interface GenericLanguageSyntax {
  /** Ej. "//" o "#". Ausente si el lenguaje no tiene comentario de línea. */
  lineComment?: string;
  /** Apertura y cierre del comentario de bloque, ej. barra-asterisco / asterisco-barra en C. Ausente si el lenguaje no tiene. */
  blockComment?: readonly [string, string];
  /** Delimitadores de string de un solo carácter, ej. ['"', "'"]. */
  quotes: readonly string[];
  /** De estos, los que permiten strings multilínea sin cerrar (ej. backtick en Go). */
  multilineQuotes?: readonly string[];
}

/**
 * Lenguajes soportados por el extractor genérico. Todos usan sintaxis de
 * cadena "estilo C" (comillas simples/dobles, escape con `\`), así que un
 * solo tokenizer parametrizado cubre todos sin código por lenguaje.
 */
export const GENERIC_LANGUAGE_SYNTAX: Readonly<Record<string, GenericLanguageSyntax>> = {
  csharp: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  java: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  kotlin: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  go: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'", "`"], multilineQuotes: ["`"] },
  rust: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  c: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  cpp: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  swift: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"'] },
  dart: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  php: { lineComment: "//", blockComment: ["/*", "*/"], quotes: ['"', "'"] },
  python: { lineComment: "#", quotes: ['"', "'"] },
  ruby: { lineComment: "#", quotes: ['"', "'"] },
};

export const GENERIC_SUPPORTED_LANGUAGES: readonly string[] = Object.keys(GENERIC_LANGUAGE_SYNTAX);

const IMPORT_LIKE_BEFORE = /(?:^|[^\w])(?:import|require(?:_once)?|include(?:_once)?|use)\s*\(?\s*$/i;

/**
 * Recorre `sourceText` carácter a carácter saltándose comentarios y
 * devuelve cada literal de cadena como candidato — sin decidir todavía si
 * "parece humano" (eso lo hace `looksLikeHumanLanguage`).
 */
export function extractGenericLiterals(languageId: string, sourceText: string): ExtractedLiteral[] {
  const syntax = GENERIC_LANGUAGE_SYNTAX[languageId];
  if (!syntax) return [];

  const literals: ExtractedLiteral[] = [];
  const n = sourceText.length;
  let i = 0;

  while (i < n) {
    if (syntax.lineComment && sourceText.startsWith(syntax.lineComment, i)) {
      const newline = sourceText.indexOf("\n", i);
      i = newline === -1 ? n : newline + 1;
      continue;
    }

    if (syntax.blockComment && sourceText.startsWith(syntax.blockComment[0], i)) {
      const end = sourceText.indexOf(syntax.blockComment[1], i + syntax.blockComment[0].length);
      i = end === -1 ? n : end + syntax.blockComment[1].length;
      continue;
    }

    const quote = syntax.quotes.find((q) => sourceText.startsWith(q, i));
    if (quote) {
      const allowsNewline = syntax.multilineQuotes?.includes(quote) ?? false;
      const start = i + quote.length;
      let j = start;
      let closed = false;

      while (j < n) {
        if (sourceText[j] === "\\") {
          j += 2;
          continue;
        }
        if (sourceText.startsWith(quote, j)) {
          closed = true;
          break;
        }
        if (sourceText[j] === "\n" && !allowsNewline) break; // string de una línea sin cerrar: se abandona
        j++;
      }

      if (closed && j > start && !isPrecededByImportKeyword(sourceText, i)) {
        literals.push({ kind: "StringLiteral", text: sourceText.slice(start, j), start, end: j });
      }

      i = closed ? j + quote.length : Math.max(j, i + 1);
      continue;
    }

    i++;
  }

  return literals;
}

function isPrecededByImportKeyword(sourceText: string, quoteIndex: number): boolean {
  const before = sourceText.slice(Math.max(0, quoteIndex - 40), quoteIndex);
  return IMPORT_LIKE_BEFORE.test(before);
}
