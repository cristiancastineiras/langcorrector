/**
 * Formato de un "pack de idioma": diccionario Hunspell (aff/dic) + reglas de
 * gramática en JSON. Es DATA, no código — deliberadamente, para poder cargar
 * (hoy desde disco, mañana desde un registry remoto) soporte de idioma nuevo
 * sin ejecutar código de terceros dentro del extension host.
 */
export interface LanguagePackManifest {
  /** Código de idioma BCP-47 corto, p. ej. "es". */
  locale: string;
  displayName: string;
  version: string;
  license: string;
  /** De dónde sale el diccionario, para atribución. */
  source: string;
  files: {
    aff: string;
    dic: string;
    phraseRules: string;
  };
  /** sha256 en hex de cada fichero listado en `files`, por nombre de fichero. */
  checksums: Record<string, string>;
  /**
   * Prefijos que este idioma suele "perder" al escribir rápido (p. ej. `["h"]`
   * en español: la H es siempre muda, así que se cae con mucha frecuencia —
   * "acer" por "hacer", "oy" por "hoy"). El motor los usa para priorizar esa
   * sugerencia por encima del ranking genérico de nspell, que no la prioriza
   * (ver `@langcorrector/engine`/spelling.ts). Vacío u omitido si no aplica.
   */
  silentPrefixes?: readonly string[];
}

/** Una regla de gramática/estilo sobre un patrón de texto (no de una sola palabra). */
export interface PhraseRuleDefinition {
  id: string;
  /** Se compila con `new RegExp(pattern, flags)`. */
  pattern: string;
  flags: string;
  /** Plantilla de reemplazo con `$1`, `$2`... referenciando grupos capturados. */
  replacement: string;
  /** Plantilla del mensaje, misma sintaxis `$1` que `replacement`. */
  message: string;
}

export interface LoadedLanguagePack {
  manifest: LanguagePackManifest;
  /** Contenido de texto del fichero .aff (reglas de afijos de Hunspell). */
  aff: string;
  /** Contenido de texto del fichero .dic (lista de palabras de Hunspell). */
  dic: string;
  phraseRules: PhraseRuleDefinition[];
}
