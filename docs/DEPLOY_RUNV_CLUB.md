# Deploy e Integracao com runv.club

## Objetivo

Servir o front-end em `garden.runv.club` num servidor Debian 13 com Apache, e permitir plantio via comando global no terminal Linux.

## Dados persistentes

O JSON ativo do jardim fica em:

- `/var/lib/runv-garden/data/garden-plants.json`

## Comando global Linux

O instalador publica este comando:

```bash
plantit [mensagem opcional]
```

Exemplo:

```bash
plantit Tudo que e belo comeca de algum lugar!
```

Arquivos relevantes:

- [scripts/plantit.mjs](Z:\Códigos\runv-garden\scripts\plantit.mjs)
- [scripts/install-garden-runv.sh](Z:\Códigos\runv-garden\scripts\install-garden-runv.sh)
- [scripts/uninstall-garden-runv.sh](Z:\Códigos\runv-garden\scripts\uninstall-garden-runv.sh)