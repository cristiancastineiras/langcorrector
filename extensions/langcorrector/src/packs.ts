import * as vscode from "vscode";
import { resolvePack, type LoadedLanguagePack } from "@langcorrector/pack-loader";

/**
 * Resuelve el pack del idioma configurado: primero busca en
 * `dist/packs/<locale>/`, bundleado dentro de la propia extensión (siempre
 * disponible para "es" en v0, sin red). Si no está ahí y
 * `langcorrector.packRegistryUrl` tiene un valor, cae al registry remoto
 * (descarga + cachea en el almacenamiento global de la extensión) 
 */
export async function resolveConfiguredPack(
  context: vscode.ExtensionContext,
  locale: string,
): Promise<LoadedLanguagePack> {
  const localPacksDir = vscode.Uri.joinPath(context.extensionUri, "dist", "packs").fsPath;
  const registryUrl = vscode.workspace.getConfiguration("langcorrector").get<string>("packRegistryUrl", "").trim();

  return resolvePack(locale, {
    localPacksDir,
    remote: registryUrl
      ? { registryUrl, cacheDir: vscode.Uri.joinPath(context.globalStorageUri, "packs").fsPath }
      : undefined,
  });
}
