export type {
  AnalysisMode,
  CorrectionIssue,
  ExtractedLiteral,
  LanguageCorrector,
  LiteralKind,
} from "./types.js";

export { extractLiterals, DEFAULT_TEXT_JSX_ATTRIBUTES } from "./extract.js";
export type { ExtractOptions, ExtractResult } from "./extract.js";

export {
  extractGenericLiterals,
  GENERIC_LANGUAGE_SYNTAX,
  GENERIC_SUPPORTED_LANGUAGES,
} from "./genericExtract.js";
export type { GenericLanguageSyntax } from "./genericExtract.js";

export { looksLikeHumanLanguage, isTechnicalContext } from "./heuristics.js";
export type { HeuristicOptions, TechnicalContext } from "./heuristics.js";
