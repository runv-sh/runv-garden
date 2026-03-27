# Deploy e Integracao com runv.club

## Objetivo

Servir o front-end em `garden.runv.club` num servidor Debian 13 com Apache, e permitir plantio via comando global no terminal Linux.

## Front-end

O front atual e totalmente estatico e pode ser publicado como build do Vite.

Comandos:

```bash
npm install
npm run build
```

Saida esperada:

- `dist/`

## Portas necessarias

Para este projeto com Apache e SSL valido, use apenas:

- `80/tcp`
- `443/tcp`

Evite porta publica aleatoria neste primeiro deploy. HTTPS valido de navegador e Certbot dependem do fluxo padrao em `80` e `443`.

## Apache no Debian 13

Exemplo de `VirtualHost` para `garden.runv.club`:

```apache
<VirtualHost *:80>
    ServerName garden.runv.club
    ServerAdmin pablomurad@pm.me
    DocumentRoot /var/www/garden.runv.club

    <Directory /var/www/garden.runv.club>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/index\.html$
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} !-f
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} !-d
    RewriteRule ^ /index.html [L]

    ErrorLog ${APACHE_LOG_DIR}/garden-error.log
    CustomLog ${APACHE_LOG_DIR}/garden-access.log combined
</VirtualHost>
```

## Dados persistentes

O JSON ativo do jardim fica em:

- `/var/lib/runv-garden/data/garden-plants.json`

O site publicado em `/var/www/garden.runv.club/data` aponta para esse diretório persistente. Assim, reexecutar o instalador atualiza o front sem apagar as plantas.

## Comando global Linux

O instalador publica um comando global:

```bash
plantit [mensagem opcional]
```

Exemplos:

```bash
plantit
plantit Tudo que e belo comeca de algum lugar!
```

Comportamento:

- usa o nome do usuario Linux que executou o comando
- grava no JSON persistente do jardim
- aplica cooldown de 24 horas por usuario
- coloca mensagem opcional junto da planta
- a planta aparece no `garden.runv.club` apos atualizar a pagina

## Script oficial de instalacao

Use:

- [scripts/install-garden-runv.sh](Z:\Códigos\runv-garden\scripts\install-garden-runv.sh)

Ele provisiona:

- Apache
- Node/npm
- build do front
- SSL valido com Certbot
- renovacao automatica via `certbot.timer` ou `cron`
- dados persistentes em `/var/lib/runv-garden/data`
- comando global `plantit`

Pode ser reexecutado com seguranca para atualizar o deploy. O JSON persistente das plantas e preservado.

## Script oficial de desinstalacao

Use:

- [scripts/uninstall-garden-runv.sh](Z:\Códigos\runv-garden\scripts\uninstall-garden-runv.sh)

Por padrao ele:

- desativa o site no Apache
- remove o `DocumentRoot`
- remove o `VirtualHost`
- remove o comando global `plantit`
- preserva certificado, codigo-fonte e dados persistentes

Para apagar tambem certificado e codigo:

```bash
REMOVE_CERTS=true REMOVE_CODE=true bash scripts/uninstall-garden-runv.sh
```

Para apagar tambem os dados persistentes das plantas:

```bash
REMOVE_DATA=true bash scripts/uninstall-garden-runv.sh
```

## Regra de negocio

Cada usuario local:

- pode plantar 1 planta a cada 24 horas
- recebe uma frase aleatoria no front
- pode anexar uma mensagem opcional

## O que o front ja suporta

Modelo pronto para:

- `creator`
- `phrase`
- `message`
- `plantedAt`
- homenagem especial da planta-hero

Arquivos relevantes:

- [src/types.ts](Z:\Códigos\runv-garden\src\types.ts)
- [src/data/gardenCommands.ts](Z:\Códigos\runv-garden\src\data\gardenCommands.ts)
- [src/data/plantPhrases.ts](Z:\Códigos\runv-garden\src\data\plantPhrases.ts)
- [scripts/plantit.mjs](Z:\Códigos\runv-garden\scripts\plantit.mjs)

## Integracao recomendada

Neste momento, o proprio terminal Linux ja consegue plantar no jardim via `plantit`. Se no futuro o `runv.club` tiver bot, painel ou servico web, esse mesmo fluxo pode ser ligado a outra interface, mantendo o mesmo JSON ou substituindo por banco/API.