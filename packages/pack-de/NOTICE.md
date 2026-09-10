# Aviso de terceros — pack de alemán

El diccionario ortográfico (`data/de_DE.aff`, `data/de_DE.dic`) **no es
nuestro**: es `de_DE_frami` de
[LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries)
(carpeta `de/`), derivado del proyecto igerman98.

- Origen: https://github.com/LibreOffice/dictionaries/tree/master/de
- Licencia: dual GPLv2/v3 o LGPLv2.0/v2.1 a elección de quien redistribuye —
  LangCorrector lo usa bajo **LGPL-2.1**. Texto completo en
  [`data/licenses/LGPLv2.1.txt`](./data/licenses/LGPLv2.1.txt).
- **Nota de codificación**: el fichero original está en ISO-8859-1 (`SET
  ISO8859-1` en el `.aff`), no en UTF-8. Para este pack se reconvirtió a
  UTF-8 (bytes reinterpretados como Latin-1 y reescritos en UTF-8, línea
  `SET` actualizada a `SET UTF-8`) — el resto del pipeline de LangCorrector
  asume UTF-8 en todos los packs. Si actualizas este fichero desde el
  origen, hay que repetir esa conversión (ver más abajo).

`data/phrase-rules.json` sí es nuestro (LangCorrector, MIT).

## Actualizar el diccionario

```sh
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/de/de_DE_frami.aff \
  -o data/de_DE.aff
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/de/de_DE_frami.dic \
  -o data/de_DE.dic
# Reconvertir de ISO-8859-1 a UTF-8 (el origen sigue sin ser UTF-8):
node -e '
  const fs = require("node:fs");
  for (const f of ["data/de_DE.aff", "data/de_DE.dic"]) {
    let text = fs.readFileSync(f, "latin1");
    if (f.endsWith(".aff")) text = text.replace(/^SET\s+\S+/m, "SET UTF-8");
    fs.writeFileSync(f, text, "utf8");
  }
'
node scripts/checksums.mjs   # recalcula los checksums de data/pack.json
```
