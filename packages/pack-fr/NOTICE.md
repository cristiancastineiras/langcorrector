# Aviso de terceros — pack de francés

El diccionario ortográfico (`data/fr.aff`, `data/fr.dic`) **no es nuestro**:
viene de [LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries)
(carpeta `fr_FR/dictionaries/`).

- Origen: https://github.com/LibreOffice/dictionaries/tree/master/fr_FR/dictionaries
- Licencia: MPL-2.0. Texto completo en
  [`data/licenses/MPL-2.0.txt`](./data/licenses/MPL-2.0.txt) y detalle del
  proyecto en [`data/licenses/README_dict_fr.txt`](./data/licenses/README_dict_fr.txt).

`data/phrase-rules.json` sí es nuestro (LangCorrector, MIT).

## Actualizar el diccionario

```sh
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/fr_FR/dictionaries/fr.aff \
  -o data/fr.aff
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/fr_FR/dictionaries/fr.dic \
  -o data/fr.dic
node scripts/checksums.mjs   # recalcula los checksums de data/pack.json
```
