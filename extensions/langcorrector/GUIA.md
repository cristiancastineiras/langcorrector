<p align="center"><img src="../../assets/banner.png" alt="LangCorrector" width="400"></p>

# Guía de uso — LangCorrector

Esta extensión **todavía no está publicada** en el Marketplace de VS Code
(ver [Estado del proyecto](../../README.md#estado)), así que "instalar y
usar" hoy significa una de estas dos cosas:

- **Opción A — Instalar el `.vsix`** (lo más parecido a instalar de verdad
  una extensión — recomendado si solo quieres *usarla*, no tocar el código).
- **Opción B — Modo desarrollo con F5** (recomendado si vas a tocar el
  código del propio LangCorrector).

Las dos activan la misma extensión; la diferencia es solo cómo llega a tu
VS Code.

## Opción A: instalar el `.vsix`

1. Genera el paquete (o pide que te pasen el `.vsix` ya generado):
   ```sh
   cd LangCorrector
   pnpm install
   pnpm --filter langcorrector package
   ```
   Esto crea `extensions/langcorrector/langcorrector-0.0.1.vsix`.
2. En VS Code (tu ventana normal, la que usas para tus proyectos):
   `Ctrl+Shift+P` → **"Extensions: Install from VSIX..."** → selecciona ese
   fichero `.vsix`.
3. Recarga la ventana si VS Code te lo pide (`Ctrl+Shift+P` →
   **"Developer: Reload Window"**).
4. Abre (o crea) un archivo `.ts`, `.py`, `.cs`... con una errata en un
   string, por ejemplo:
   ```ts
   console.log("El usuaro no tiene permissos");
   ```
5. Espera ~1 segundo (la primera vez que abres un archivo de ese idioma,
   LangCorrector carga su diccionario — ver "Rendimiento" más abajo).
   Debería aparecer un subrayado bajo `usuaro` y `permissos`.
6. Pon el cursor sobre la palabra subrayada y pulsa `Ctrl+.` (Quick Fix) —
   debe ofrecerte "Cambiar a: usuario".

Para desinstalarla: `Ctrl+Shift+P` → **"Extensions: Show Installed
Extensions"** → busca "LangCorrector" → engranaje → Uninstall.

## Opción B: modo desarrollo (F5)

1. Abre **la raíz del monorepo** (`LangCorrector/`, no la carpeta
   `extensions/langcorrector/` a solas) en VS Code.
2. `pnpm install` y `pnpm build` si no lo has hecho ya.
3. Pulsa **F5** (o el icono ▷ de "Run and Debug", configuración "Ejecutar
   LangCorrector"). Se abre una **segunda ventana de VS Code**, con el
   título terminado en `[Extension Development Host]` — esa ventana es la
   que tiene LangCorrector activo, **no** la ventana original desde la que
   pulsaste F5.
4. Esa segunda ventana abre `extensions/langcorrector/sample/` como
   carpeta. Abre `demo.ts`, `demo.tsx`, `demo.cs` o `demo.py` y deberías ver
   los subrayados igual que en la Opción A.

Cada vez que cambies código de la extensión: cierra esa segunda ventana,
`pnpm --filter langcorrector build` de nuevo, y F5 otra vez (o usa
`pnpm --filter langcorrector dev` en una terminal aparte para watch mode, y
solo recarga la ventana de desarrollo con `Ctrl+R`).

## Qué debería pasar (y qué no)

✅ Subrayado (con severidad "Información", punteado azul/gris, no rojo —
no son errores de compilación) bajo el texto exacto con la errata, no en
toda la línea.

✅ `Ctrl+.` sobre el subrayado ofrece una o varias correcciones.

✅ Pasar el ratón por encima del subrayado muestra el mensaje
("Posible error ortográfico: ...").

❌ Nada dentro de nombres de variables/funciones/clases, imports, rutas,
URLs, claves de configuración.

## Idiomas de programación soportados

| Con AST real (máxima precisión) | Con extractor genérico (comillas + comentarios) |
| --- | --- |
| TypeScript, TSX, JavaScript, JSX | C#, Java, Kotlin, Go, Rust, C, C++, Swift, Dart, PHP, Python, Ruby |

El extractor genérico no tiene un parser completo del lenguaje: encuentra
literales de cadena (`"..."`/`'...'`) saltándose comentarios, pero no
conoce identificadores declarados en el archivo como sí hace el AST de
TS/JS. Detalle técnico en
[packages/core/src/genericExtract.ts](../../packages/core/src/genericExtract.ts).

**¿Tu lenguaje no está en la lista?** Añadirlo (si usa comillas normales
para strings) es añadir una entrada a `GENERIC_LANGUAGE_SYNTAX` en ese
archivo — dilo y lo añadimos.

## Idiomas humanos soportados

`langcorrector.language`: `es` (español, por defecto), `en` (inglés), `fr`
(francés), `de` (alemán). Cámbialo en Settings (`Ctrl+,`, busca
"langcorrector").

## Rendimiento: por qué la primera vez tarda

Al activarse, LangCorrector carga el diccionario Hunspell del idioma
configurado — una sola vez por sesión de VS Code, no por archivo. El coste
varía mucho según el idioma: es ~1s, en ~0.3s, fr ~5-6s, de ~5s (más
afijos). Si acabas de abrir VS Code y no ves nada todavía, espera unos
segundos antes de asumir que algo falla.

## Solución de problemas: "no veo nada"

Revisa en este orden:

1. **¿Es un archivo de un lenguaje soportado?** Mira la tabla de arriba. Un
   `.json`, `.yaml`, `.md` o `.vue` no está soportado todavía.
2. **¿Se activó la extensión?** `Ctrl+Shift+P` → "Developer: Show Running
   Extensions" → busca "LangCorrector" en la lista. Si no aparece, no se
   activó — revisa el punto 1, y si el archivo SÍ es de un lenguaje
   soportado, es un bug: dínoslo con la versión de VS Code y el lenguaje.
3. **¿Ha pasado ya el tiempo de carga del diccionario?** Ver
   "Rendimiento" arriba — espera unos segundos tras abrir el primer
   archivo de esa sesión.
4. **`langcorrector.enable` está en `true`?** Settings → busca
   "langcorrector.enable".
5. **¿El texto en sí "parece" código?** LangCorrector decide primero si un
   string parece lenguaje humano antes de corregirlo — un string tipo
   `"userRepository"` o `"api/v1/users"` se ignora a propósito.
   Prueba con una frase clara con espacios y una errata evidente, como el
   ejemplo del paso 4 de la Opción A.
6. **Mira la consola de la extensión**: en la ventana donde corre
   LangCorrector, `Ctrl+Shift+P` → "Developer: Toggle Developer Tools" →
   pestaña Console → filtra por `langcorrector`. Cualquier error de
   activación aparece ahí con el prefijo `[langcorrector]`.

Si tras esto sigue sin funcionar, dinos exactamente: qué archivo abriste
(extensión), qué opción usaste (A o B), y lo que veas en el paso 6 — con
eso sí puedo diagnosticar el caso concreto.
