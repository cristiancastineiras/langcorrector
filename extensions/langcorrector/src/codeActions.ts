import * as vscode from "vscode";
import { suggestionsByDiagnostic } from "./scan.js";

/**
 * Quick Fix por sugerencia y diagnóstico (puede
 * haber más de una — ver el comentario en scan.ts sobre el orden de nspell),
 * que reemplaza solo el texto marcado. La primera sugerencia del motor se
 * marca como preferida (☆ en VS Code / aplicable con "Quick Fix por
 * defecto"); el resto aparece igualmente en el menú de la bombilla.
 */
export class LangCorrectorCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  constructor(private readonly diagnosticSource: string) {}

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== this.diagnosticSource) continue;
      const suggestions = suggestionsByDiagnostic.get(diagnostic);
      if (!suggestions || suggestions.length === 0) continue;

      suggestions.forEach((suggestion, index) => {
        const action = new vscode.CodeAction(`Cambiar a: "${suggestion}"`, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = index === 0;
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, diagnostic.range, suggestion);
        actions.push(action);
      });
    }

    return actions;
  }
}
