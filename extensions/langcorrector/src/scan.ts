import * as vscode from "vscode";
import {
  extractGenericLiterals,
  extractLiterals,
  GENERIC_SUPPORTED_LANGUAGES,
  looksLikeHumanLanguage,
} from "@langcorrector/core";
import type { ExtractedLiteral, LanguageCorrector } from "@langcorrector/core";

/** TS/JS/JSX: extracción por AST real (@langcorrector/core, vía el compilador de TypeScript). */
const AST_LANGUAGES: readonly string[] = ["typescript", "typescriptreact", "javascript", "javascriptreact"];

/**
 * Todo lo demás: extracción por tokenizer genérico (comentarios + comillas,
 * sin AST — ver `packages/core/src/genericExtract.ts`). Menos preciso que
 * el AST, pero cubre muchos lenguajes sin un parser por cada uno.
 */
const GENERIC_LANGUAGES: readonly string[] = GENERIC_SUPPORTED_LANGUAGES;

export const SUPPORTED_LANGUAGES: readonly string[] = [...AST_LANGUAGES, ...GENERIC_LANGUAGES];

/**
 * Asocia cada `vscode.Diagnostic` que generamos con sus correcciones
 * sugeridas (puede haber varias: nspell no siempre pone la más natural
 * primera — p. ej. para "sesion" antepone formas verbales como "sesiona" a
 * "sesión", que también es una sugerencia válida más abajo en la lista — así
 * que ofrecemos un Quick Fix por sugerencia en vez de forzar una sola).
 * VS Code nos devuelve las mismas instancias en `CodeActionContext.diagnostics`,
 * así que un WeakMap por instancia es más simple y seguro que meter las
 * sugerencias en `diagnostic.code` (que se usa para la categoría/regla).
 */
export const suggestionsByDiagnostic = new WeakMap<vscode.Diagnostic, readonly string[]>();

export type Scanner = (document: vscode.TextDocument) => Promise<vscode.Diagnostic[]>;

/**
 * Fase 1 (extracción) + heurística de humanidad + Fase 3 (corrección, vía el
 * `LanguageCorrector` del pack ya cargado) para un documento completo. El
 * corrector es inyectado — este módulo no sabe qué idioma humano es.
 */
export function createScanner(corrector: LanguageCorrector, diagnosticSource: string): Scanner {
  return async function scanDocument(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
    const text = document.getText();
    const { literals, declaredIdentifiers } = extractForLanguage(document.languageId, document.fileName, text);
    if (literals.length === 0) return [];

    const diagnostics: vscode.Diagnostic[] = [];

    for (const literal of literals) {
      if (!looksLikeHumanLanguage(literal.text, { knownIdentifiers: declaredIdentifiers })) continue;

      const issues = await corrector.check(literal.text);
      for (const issue of issues) {
        if (issue.suggestions.length === 0) continue;

        const range = new vscode.Range(
          document.positionAt(literal.start + issue.start),
          document.positionAt(literal.start + issue.end),
        );
        const diagnostic = new vscode.Diagnostic(range, issue.message, vscode.DiagnosticSeverity.Information);
        diagnostic.source = diagnosticSource;
        diagnostic.code = issue.rule;

        suggestionsByDiagnostic.set(diagnostic, issue.suggestions);
        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  };
}

function extractForLanguage(
  languageId: string,
  fileName: string,
  text: string,
): { literals: readonly ExtractedLiteral[]; declaredIdentifiers?: ReadonlySet<string> } {
  if (AST_LANGUAGES.includes(languageId)) {
    return extractLiterals(fileName, text);
  }
  if (GENERIC_LANGUAGES.includes(languageId)) {
    return { literals: extractGenericLiterals(languageId, text) };
  }
  return { literals: [] };
}
