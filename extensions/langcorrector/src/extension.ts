import * as vscode from "vscode";
import { createLanguageCorrector } from "@langcorrector/engine";
import { LangCorrectorCodeActionProvider } from "./codeActions.js";
import { resolveConfiguredPack } from "./packs.js";
import { createScanner, SUPPORTED_LANGUAGES, type Scanner } from "./scan.js";

const SELECTOR: vscode.DocumentSelector = SUPPORTED_LANGUAGES.map((language) => ({ language }));
const DEBOUNCE_MS = 300;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const diagnostics = vscode.languages.createDiagnosticCollection("langcorrector");
  context.subscriptions.push(diagnostics);

  const language = getLanguageSetting();
  const loaded = await loadScanner(context, language);
  if (!loaded) return; // sin pack no hay nada que registrar; ya se avisó al usuario

  const { scanDocument, diagnosticSource } = loaded;
  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const scheduleScan = (document: vscode.TextDocument, delay = DEBOUNCE_MS): void => {
    if (!isEnabled() || !SUPPORTED_LANGUAGES.includes(document.languageId)) return;

    const key = document.uri.toString();
    const existing = pendingTimers.get(key);
    if (existing) clearTimeout(existing);

    pendingTimers.set(
      key,
      setTimeout(() => {
        pendingTimers.delete(key);
        void runScan(document, diagnostics, scanDocument);
      }, delay),
    );
  };

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(SELECTOR, new LangCorrectorCodeActionProvider(diagnosticSource), {
      providedCodeActionKinds: LangCorrectorCodeActionProvider.providedCodeActionKinds,
    }),
    vscode.workspace.onDidOpenTextDocument((document) => scheduleScan(document, 0)),
    vscode.workspace.onDidChangeTextDocument((event) => scheduleScan(event.document)),
    vscode.workspace.onDidSaveTextDocument((document) => scheduleScan(document, 0)),
    vscode.workspace.onDidCloseTextDocument((document) => diagnostics.delete(document.uri)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("langcorrector")) return;
      if (!isEnabled()) {
        diagnostics.clear();
        return;
      }
      for (const editor of vscode.window.visibleTextEditors) scheduleScan(editor.document, 0);
    }),
    vscode.commands.registerCommand("langcorrector.checkDocument", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) scheduleScan(editor.document, 0);
    }),
  );

  for (const editor of vscode.window.visibleTextEditors) {
    scheduleScan(editor.document, 0);
  }
}

export function deactivate(): void {
  // El DiagnosticCollection y los listeners se liberan vía context.subscriptions;
  // los timers de debounce pendientes son inofensivos al desactivar la extensión.
}

async function loadScanner(
  context: vscode.ExtensionContext,
  language: string,
): Promise<{ scanDocument: Scanner; diagnosticSource: string } | undefined> {
  try {
    const pack = await resolveConfiguredPack(context, language);
    const diagnosticSource = `LangCorrector (${pack.manifest.displayName})`;
    const corrector = createLanguageCorrector(pack);
    return { scanDocument: createScanner(corrector, diagnosticSource), diagnosticSource };
  } catch (error) {
    console.error("[langcorrector] No se pudo cargar el pack de idioma:", error);
    void vscode.window.showErrorMessage(
      `LangCorrector: no se pudo cargar el pack de idioma "${language}". El análisis está desactivado ` +
        "(ver la consola de desarrollador — Help > Toggle Developer Tools — para más detalle).",
    );
    return undefined;
  }
}

function isEnabled(): boolean {
  return vscode.workspace.getConfiguration("langcorrector").get<boolean>("enable", true);
}

function getLanguageSetting(): string {
  return vscode.workspace.getConfiguration("langcorrector").get<string>("language", "es");
}

async function runScan(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection,
  scanDocument: Scanner,
): Promise<void> {
  try {
    const found = await scanDocument(document);
    diagnosticCollection.set(document.uri, found);
  } catch (error) {
    console.error("[langcorrector] Error analizando el documento:", error);
  }
}
