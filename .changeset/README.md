# Changesets

`pnpm changeset` registra qué paquetes han cambiado y de qué tipo es el
cambio (patch/minor/major). `pnpm version-packages` aplica esos cambios:
sube versiones y actualiza el `CHANGELOG.md` de cada paquete afectado.

Como cada extensión de VS Code es un paquete independiente
(`langcorrector-es`, mañana `langcorrector-en`...), esto es lo que permite
que cada idioma tenga su propio versionado y changelog sin tener que
sincronizar releases entre ellos.

Más info: https://github.com/changesets/changesets
