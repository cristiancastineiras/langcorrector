# Aviso de terceros — pack de inglés

El diccionario ortográfico (`data/en_US.aff`, `data/en_US.dic`) **no es
nuestro**: es el `en_US` de
[LibreOffice/dictionaries](https://github.com/LibreOffice/dictionaries)
(carpeta `en/`).

- Origen: https://github.com/LibreOffice/dictionaries/tree/master/en
- La lista de palabras es el wordlist SCOWL de Kevin Atkinson (2000-2018),
  con permiso de uso/copia/modificación/distribución sin coste para
  cualquier propósito. El fichero de afijos (`en_US.aff`) es una versión
  modificada del `english.aff` de Ispell (Geoff Kuenning), licencia BSD.
  Texto completo en [`data/licenses/README_en_US.txt`](./data/licenses/README_en_US.txt).

`data/phrase-rules.json` sí es nuestro (LangCorrector, MIT).

## Actualizar el diccionario

```sh
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/en/en_US.aff \
  -o data/en_US.aff
curl --ssl-no-revoke -sS \
  https://raw.githubusercontent.com/LibreOffice/dictionaries/master/en/en_US.dic \
  -o data/en_US.dic
node scripts/checksums.mjs   # recalcula los checksums de data/pack.json
```
