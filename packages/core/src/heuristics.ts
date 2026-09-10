/**
 * "¿Este texto lo va a leer una persona?" 
 * Es intencionadamente independiente del idioma: solo mira forma
 * (espacios, casing, pinta de identificador/ruta/URL), nunca ortografía.
 *
 * No pretende ser perfecta. Es barata, explicable y corre antes que nada
 * (incluido el motor de corrección), así que los falsos negativos son
 * preferibles a los falsos positivos: mejor dejar pasar algún string dudoso
 * que gritar sobre un identificador.
 */

const CAMEL_OR_PASCAL_CASE = /^[a-zA-Z][a-zA-Z0-9]*$/;
const SNAKE_OR_SCREAMING_CASE = /^[A-Za-z][A-Za-z0-9]*(_[A-Za-z0-9]+)+$/;
const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const I18N_KEY = /^[a-z][a-z0-9]*(\.[a-z0-9]+){1,}$/i;
const PATH_LIKE = /^\.{0,2}\/?[\w.-]+(\/[\w.-]+)+\/?$/;
const URL_LIKE = /^[a-z]+:\/\//i;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_OR_UUID = /^[0-9a-f]{6,}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ONLY_PUNCTUATION_OR_SYMBOLS = /^[^\p{L}]*$/u;
const HAS_TWO_ALPHA_WORDS_WITH_SPACE = /\p{L}{2,}[^\S\r\n]+\p{L}{2,}/u;
const SINGLE_WORD_WITH_VOWEL_CONSONANT_MIX = /^\p{L}*[aeiouáéíóúAEIOUÁÉÍÓÚ]\p{L}*[bcdfghjklmnñpqrstvwxyzBCDFGHJKLMNÑPQRSTVWXYZ]\p{L}*$/u;

export interface HeuristicOptions {
  /**
   * Identificadores declarados en el propio archivo (nombres de variables,
   * funciones, clases...). Si el texto de un string coincide exactamente con
   * uno de ellos, se descarta: es casi siempre una key o un nombre puesto
   * entre comillas por otra razón técnica, no una frase para el usuario.
   */
  knownIdentifiers?: ReadonlySet<string>;
}

/**
 * Devuelve `true` si `raw` (texto ya desnudo, sin comillas) parece lenguaje
 * humano y por tanto debe pasar al motor de corrección del idioma.
 */
export function looksLikeHumanLanguage(raw: string, options: HeuristicOptions = {}): boolean {
  const text = raw.trim();

  if (text.length === 0) return false;
  if (ONLY_PUNCTUATION_OR_SYMBOLS.test(text)) return false;
  if (options.knownIdentifiers?.has(text)) return false;

  if (
    URL_LIKE.test(text) ||
    EMAIL_LIKE.test(text) ||
    HEX_OR_UUID.test(text) ||
    PATH_LIKE.test(text) ||
    I18N_KEY.test(text)
  ) {
    return false;
  }

  // Frase con espacio entre dos palabras "de verdad" -> señal fuerte de texto humano,
  // salvo que además tenga pinta de identificador compuesto raro (poco común, pero
  // el resto de reglas ya filtran los casos ambiguos habituales).
  if (HAS_TWO_ALPHA_WORDS_WITH_SPACE.test(text)) return true;

  // Sin espacios: solo cuela si NO tiene forma de identificador de código.
  if (!/\s/.test(text)) {
    if (SNAKE_OR_SCREAMING_CASE.test(text)) return false;
    if (KEBAB_CASE.test(text)) return false;
    if (CAMEL_OR_PASCAL_CASE.test(text) && /[a-z][A-Z]|[A-Z]{2,}[a-z]/.test(text)) return false; // camelCase / PascalCase
    if (CAMEL_OR_PASCAL_CASE.test(text) && text === text.toUpperCase() && text.length <= 6) return false; // acrónimos tipo JWT, API

    // Palabra suelta con mezcla vocal/consonante natural ("Error", "Cargando") se acepta;
    // el resto (identificadores de una sola palabra sin mezcla clara) se descarta.
    return SINGLE_WORD_WITH_VOWEL_CONSONANT_MIX.test(text) && text.length >= 3;
  }

  return false;
}

/** Posiciones sintácticas que casi siempre son técnicas aunque el texto "parezca" humano. */
export type TechnicalContext =
  | "import-source"
  | "require-source"
  | "dynamic-import-source"
  | "process-env-key"
  | "object-key";

const TECHNICAL_CONTEXTS: ReadonlySet<TechnicalContext> = new Set([
  "import-source",
  "require-source",
  "dynamic-import-source",
  "process-env-key",
  "object-key",
]);

export function isTechnicalContext(context: TechnicalContext): boolean {
  return TECHNICAL_CONTEXTS.has(context);
}
