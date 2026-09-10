// Bundler de la extensión: src/extension.ts -> dist/extension.cjs, más una
// copia sin transformar de los packs de idioma (dist/packs/<locale>/) —
// nunca pasan por esbuild, se leen en runtime con fs (ver src/packs.ts).
import esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

async function copyPacks() {
  const packsOut = join(root, "dist", "packs");
  await rm(packsOut, { recursive: true, force: true });
  await mkdir(packsOut, { recursive: true });

  // Cada idioma bundleado es una línea, no código nuevo
  // Un idioma que NO está aquí (todavía) se resuelve en runtime vía
  // langcorrector.packRegistryUrl si hay uno configurado (ver src/packs.ts).
  const packagesDir = join(root, "..", "..", "packages");
  const packs = [
    { locale: "es", source: join(packagesDir, "pack-es", "data") },
    { locale: "en", source: join(packagesDir, "pack-en", "data") },
    { locale: "fr", source: join(packagesDir, "pack-fr", "data") },
    { locale: "de", source: join(packagesDir, "pack-de", "data") },
  ];

  for (const pack of packs) {
    await cp(pack.source, join(packsOut, pack.locale), { recursive: true });
  }
  console.log(`[langcorrector] packs copiados: ${packs.map((p) => p.locale).join(", ")}`);
}

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.cjs",
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["vscode"],
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

await copyPacks();

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("[langcorrector] watching for changes...");
} else {
  await esbuild.build(options);
}
