/**
 * localizar en el AST los nodos que pueden contener
 * lenguaje humano. Este módulo NO decide si el texto está bien escrito ni si
 * "parece" humano (eso es `heuristics.ts`) — solo encuentra candidatos y sus
 * offsets exactos en el archivo fuente, excluyendo ya las posiciones que son
 * casi siempre técnicas (imports, require, process.env, claves de objeto,
 * atributos JSX que no son de texto).
 */

import ts from "typescript";
import type { ExtractedLiteral, LiteralKind } from "./types.js";

/**
 * Atributos JSX que casi siempre llevan texto pensado para el usuario final.
 * Cualquier otro atributo (`className`, `id`, `data-testid`, `href`...) se
 * ignora aunque su valor sea un string literal.
 */
export const DEFAULT_TEXT_JSX_ATTRIBUTES: ReadonlySet<string> = new Set([
  "title",
  "placeholder",
  "alt",
  "aria-label",
  "aria-description",
]);

export interface ExtractOptions {
  textJsxAttributes?: ReadonlySet<string>;
}

export interface ExtractResult {
  literals: ExtractedLiteral[];
  /** Identificadores declarados en el archivo — para {@link HeuristicOptions.knownIdentifiers}. */
  declaredIdentifiers: Set<string>;
}

export function extractLiterals(
  fileName: string,
  sourceText: string,
  options: ExtractOptions = {},
): ExtractResult {
  const textJsxAttributes = options.textJsxAttributes ?? DEFAULT_TEXT_JSX_ATTRIBUTES;
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    getScriptKind(fileName),
  );

  const literals: ExtractedLiteral[] = [];
  const declaredIdentifiers = new Set<string>();

  visit(sourceFile);
  return { literals, declaredIdentifiers };

  function visit(node: ts.Node): void {
    collectDeclaredIdentifier(node, declaredIdentifiers);

    if (ts.isStringLiteralLike(node)) {
      handleStringLiteralLike(node);
    } else if (ts.isTemplateExpression(node)) {
      handleTemplateExpression(node);
    } else if (ts.isJsxText(node)) {
      handleJsxText(node);
    }

    // Seguimos bajando siempre: necesitamos encontrar literales anidados
    // dentro de `${...}` en un template literal, dentro de un JsxExpression,
    // o dentro de cualquier otra expresión.
    ts.forEachChild(node, visit);
  }

  function handleStringLiteralLike(node: ts.StringLiteralLike): void {
    const parent = node.parent;
    if (!parent) return;

    if (isModuleSpecifierOf(node, parent)) return; // import/export ... from "..."
    if (isRequireArgument(node, parent)) return; // require("...")
    if (isDynamicImportArgument(node, parent)) return; // import("...")
    if (isProcessEnvKey(node, parent)) return; // process.env["..."]
    if (ts.isPropertyAssignment(parent) && parent.name === node) return; // clave de objeto

    let kind: LiteralKind = "StringLiteral";
    let attributeName: string | undefined;

    if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
      kind = "ObjectPropertyValue";
    } else if (ts.isJsxAttribute(parent) && parent.initializer === node) {
      const name = parent.name.getText(sourceFile);
      if (!textJsxAttributes.has(name)) return; // atributo técnico
      kind = "JsxAttribute";
      attributeName = name;
    }

    const start = node.getStart(sourceFile) + 1; // salta la comilla/backtick de apertura
    const end = node.getEnd() - 1; // salta la comilla/backtick de cierre
    if (end <= start) return; // string vacío

    literals.push({ kind, text: sourceText.slice(start, end), start, end, attributeName });
  }

  function handleTemplateExpression(node: ts.TemplateExpression): void {
    pushTemplatePiece(node.head);
    for (const span of node.templateSpans) {
      pushTemplatePiece(span.literal);
    }
  }

  function pushTemplatePiece(node: ts.TemplateHead | ts.TemplateMiddle | ts.TemplateTail): void {
    const leadingDelimiterLength = 1; // "`" (head) o "}" (middle/tail)
    const trailingDelimiterLength = node.kind === ts.SyntaxKind.TemplateTail ? 1 : 2; // "`" o "${"
    const start = node.getStart(sourceFile) + leadingDelimiterLength;
    const end = node.getEnd() - trailingDelimiterLength;
    if (end <= start) return;
    literals.push({ kind: "TemplateLiteralSpan", text: sourceText.slice(start, end), start, end });
  }

  function handleJsxText(node: ts.JsxText): void {
    const full = sourceText.slice(node.getStart(sourceFile), node.getEnd());
    const leading = full.length - full.trimStart().length;
    const trailing = full.length - full.trimEnd().length;
    const text = full.slice(leading, full.length - trailing);
    if (text.length === 0) return; // solo indentación/saltos de línea entre tags
    const start = node.getStart(sourceFile) + leading;
    const end = node.getEnd() - trailing;
    literals.push({ kind: "JsxText", text, start, end });
  }
}

function isModuleSpecifierOf(node: ts.Node, parent: ts.Node): boolean {
  return (
    (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
    parent.moduleSpecifier === node
  );
}

function isRequireArgument(node: ts.Node, parent: ts.Node): boolean {
  return (
    ts.isCallExpression(parent) &&
    ts.isIdentifier(parent.expression) &&
    parent.expression.text === "require" &&
    parent.arguments[0] === node
  );
}

function isDynamicImportArgument(node: ts.Node, parent: ts.Node): boolean {
  return (
    ts.isCallExpression(parent) &&
    parent.expression.kind === ts.SyntaxKind.ImportKeyword &&
    parent.arguments[0] === node
  );
}

function isProcessEnvKey(node: ts.Node, parent: ts.Node): boolean {
  if (!ts.isElementAccessExpression(parent) || parent.argumentExpression !== node) return false;
  const target = parent.expression;
  return (
    ts.isPropertyAccessExpression(target) &&
    ts.isIdentifier(target.expression) &&
    target.expression.text === "process" &&
    target.name.text === "env"
  );
}

function collectDeclaredIdentifier(node: ts.Node, into: Set<string>): void {
  const named =
    ts.isVariableDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isParameter(node) ||
    ts.isPropertySignature(node) ||
    ts.isPropertyDeclaration(node);

  if (named && node.name && ts.isIdentifier(node.name)) {
    into.add(node.name.text);
  }
}

function getScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (fileName.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}
