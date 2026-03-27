# Deploy Checklist v0.0.1

Versao alvo: `0.0.1`
Dominio alvo: `garden.runv.club`
Servidor alvo: `Debian 13` com `Apache`

## Pre-condicoes

Antes de executar qualquer comando, confirme:

1. `garden.runv.club` ja aponta para o IP publico do servidor.
2. As portas `80/tcp` e `443/tcp` estao liberadas no firewall.
3. O repositorio do projeto esta acessivel por `git clone` no servidor.
4. O deploy sera da landing `v0.0.1`, sem backend real ainda.

## Portas necessarias

Para o primeiro deploy com Apache + Certbot, abra somente:

- `80/tcp`
- `443/tcp`

Nao recomendo porta publica aleatoria aqui, porque:

- navegadores esperam HTTPS em `443`
- o Certbot/Let's Encrypt funciona melhor com `80` e `443`
- isso evita configuracao extra de reverse proxy ou portas nao padrao

## Ordem exata dos comandos no Debian 13

### 1. Entrar no servidor

```bash
ssh root@SEU_IP
```

### 2. Ir para a pasta de trabalho

```bash
cd /opt/runv-garden
```

### 3. Executar o instalador oficial

```bash
sudo bash scripts/install-garden-runv.sh
```

Se precisar fixar outra branch:

```bash
sudo REPO_REF='sua-branch' bash scripts/install-garden-runv.sh
```

## O que o script faz

O script [install-garden-runv.sh](Z:\Códigos\runv-garden\scripts\install-garden-runv.sh):

1. instala Apache, Node, npm, rsync, Certbot e cron
2. valida Node.js 20+
3. detecta ou atualiza o checkout git atual
4. instala dependencias JavaScript
5. gera o build de producao
6. preserva ou inicializa o JSON persistente das plantas em `/var/lib/runv-garden/data`
7. publica o `dist/` em `/var/www/garden.runv.club`
8. cria e ativa o `VirtualHost` do Apache
9. emite SSL valido com Certbot
10. ativa renovacao automatica por `certbot.timer` ou `cron`

## Garantia de update sem perda

Reexecutar o instalador e o caminho certo para atualizar o deploy.

O que ele preserva por padrao:

- `/var/lib/runv-garden/data/garden-plants.json`

Isso significa que um novo build ou novo `git pull` nao apaga os dados ja existentes do jardim.

## Verificacoes manuais apos o script

Executar no servidor:

```bash
apache2ctl configtest
systemctl status apache2 --no-pager
certbot certificates
systemctl status certbot.timer --no-pager
ls -l /var/www/garden.runv.club/data
ls -l /var/lib/runv-garden/data
```

Se o servidor nao usar `certbot.timer`, verificar o cron:

```bash
cat /etc/cron.d/certbot-renew-runv-garden
systemctl status cron --no-pager
```

## Desinstalacao

O desinstalador remove apenas artefatos desta instalacao do `garden.runv.club`. Ele nao remove pacotes do sistema, nao mexe em outros sites e nao altera configuracoes globais fora do que foi criado por este deploy.

Se precisar remover o deploy:

```bash
sudo bash scripts/uninstall-garden-runv.sh
```

Se quiser apagar tambem certificado e codigo-fonte:

```bash
sudo REMOVE_CERTS=true REMOVE_CODE=true bash scripts/uninstall-garden-runv.sh
```

Se quiser apagar tambem os dados persistentes das plantas:

```bash
sudo REMOVE_DATA=true bash scripts/uninstall-garden-runv.sh
```

## Verificacoes no navegador

Abrir:

- `https://garden.runv.club`

Confirmar:

1. SSL valido
2. landing carregando
3. arvore central visivel
4. homenagem da planta central aparecendo no hover/click
5. zoom funcionando
6. sem erro no console do navegador

## Estado desta versao 0.0.1

Pronto para deploy:

- landing estatica
- Apache
- SSL valido
- renovacao automatica
- assets locais
- memorial da planta central
- JSON local persistente para o jardim

Ainda nao pronto para producao completa do sistema global:

- persistencia real de plantas em backend multiusuario
- comando global `!plantar` no `runv.club`
- validacao real de 24h no servidor
- listagem real de plantas por API

## Proximo passo apos o deploy da landing

Implementar o backend do `runv.club` para:

1. receber `!plantar [mensagem opcional]`
2. identificar o usuario real
3. validar 1 planta a cada 24h
4. salvar planta, frase e mensagem
5. entregar JSON/API para o front