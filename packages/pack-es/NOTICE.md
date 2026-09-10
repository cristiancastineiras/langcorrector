# Aviso de terceros — pack de español

El diccionario ortográfico (`data/es_ES.aff`, `data/es_ES.dic`) **no es
nuestro**: viene del proyecto de diccionarios de
[LibreOffice](https://github.com/LibreOffice/dictionaries) (carpeta `es/`),
heredero del proyecto histórico "Español" (Santiago Bosio y colaboradores).
Es el mismo diccionario que usan LibreOffice, Firefox, Thunderbird y Chromium
para corrección ortográfica en español.

- Origen: https://github.com/LibreOffice/dictionaries/tree/master/es
- Licencia: tri-licenciado GPLv3 / LGPLv3 / MPL-1.1 (a elección de quien
  redistribuye). LangCorrector lo usa bajo **MPL-1.1**.
- Textos completos de las tres licencias en [`data/licenses/`](./data/licenses/).

`data/phrase-rules.json` sí es nuestro (LangCorrector, MIT — ver el
[LICENSE](../../LICENSE) del monorepo cuando exista).

## Por qué esto no es un problema de licencias para el resto del código

El diccionario es un fichero de **datos** (una lista de palabras + reglas de
afijos), no código que se enlace con el nuestro. Se distribuye tal cual junto
al resto de la extensión, igual que hacen LibreOffice/Firefox/Chromium con el
mismo fichero — no convierte al resto de LangCorrector en GPL/LGPL/MPL.

## Actualizar el diccionario

```sh
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/es/es_ES.aff \
  -o data/es_ES.aff
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/es/es_ES.dic \
  -o data/es_ES.dic
node scripts/checksums.mjs   # recalcula los checksums de data/pack.json
```

(`--ssl-no-revoke` solo hace falta en Windows si `curl` falla con un error de
comprobación de revocación de certificado — no es necesario en Linux/macOS/CI.)
