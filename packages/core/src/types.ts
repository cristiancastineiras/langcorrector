/**
 * Contratos compartidos por todo LangCorrector. Este archivo no sabe nada de
 * ningún idioma en concreto: define QUÉ es un candidato a texto humano y QUÉ
 * forma tiene una corrección, pero no CÓMO se corrige (eso lo decide cada
 * @langcorrector/engine implementando {@link LanguageCorrector} a partir de
 * los datos de un pack de idioma, ver @langcorrector/pack-loader).
 */

/** Nodo del AST del que puede salir un candidato a texto humano. */
export type LiteralKind =
  | "StringLiteral"
  | "TemplateLiteralSpan"
  | "JsxText"
  | "JsxAttribute"
  | "ObjectPropertyValue";

/**
 * Un fragmento de código que la heurística considera potencialmente lenguaje
 * humano. `start`/`end` son offsets de carácter dentro del texto fuente
 * ORIGINAL (incluyendo comillas y backticks), para poder mapear a un
 * `vscode.Range` y aplicar un Quick Fix sin desplazamientos manuales.
 */
export interface ExtractedLiteral {
  kind: LiteralKind;
  /** Texto ya "desnudo": sin comillas ni backticks, sin las `${...}` de un template literal. */
  text: string;
  /** Offset (inclusive) del inicio del texto desnudo en el archivo fuente. */
  start: number;
  /** Offset (exclusivo) del final del texto desnudo en el archivo fuente. */
  end: number;
  /** Nombre del atributo JSX (`placeholder`, `aria-label`...) cuando kind es "JsxAttribute". */
  attributeName?: string;
}

/** Un problema de idioma detectado dentro de un {@link ExtractedLiteral}. */
export interface CorrectionIssue {
  /** Offset relativo al `text` del literal (no al archivo). */
  start: number;
  end: number;
  message: string;
  /** Reemplazos sugeridos, el primero es el que ofrece el Quick Fix por defecto. */
  suggestions: string[];
  /** Categoría orientativa para agrupar/silenciar en el futuro (p. ej. "spelling", "accent", "grammar"). */
  rule: string;
}

/**
 * Contrato que implementa `@langcorrector/engine` (uno solo, parametrizado
 * por el pack de idioma activo — no una implementación por idioma).
 * Deliberadamente mínimo: recibe texto plano y devuelve problemas; no sabe
 * nada de AST, VS Code ni offsets de archivo — de eso se encarga quien lo
 * llama.
 */
export interface LanguageCorrector {
  /** Código de idioma BCP-47 corto, p. ej. "es". */
  readonly locale: string;
  check(text: string): Promise<CorrectionIssue[]> | CorrectionIssue[];
}


export type AnalysisMode = "strict" | "ui" | "console";
