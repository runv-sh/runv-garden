# Deploy Checklist v0.0.1

Versao alvo: `0.0.1`
Dominio alvo: `garden.runv.club`
Servidor alvo: `Debian 13` com `Apache`

## Pre-condicoes

Antes de executar qualquer comando, confirme:

1. `garden.runv.club` ja aponta para o IP publico do servidor.
2. As portas `80` e `443` estao liberadas no firewall.
3. O repositorio do projeto esta acessivel por `git clone` no servidor.
4. O deploy sera da landing `v0.0.1`, sem backend real ainda.

## Ordem exata dos comandos no Debian 13

### 1. Entrar no servidor

```bash
ssh root@SEU_IP
```

### 2. Ir para a pasta temporaria de trabalho

```bash
cd /root
```

### 3. Clonar o projeto

```bash
git clone https://SEU_REPOSITORIO.git runv-garden
cd runv-garden
```

### 4. Executar o instalador oficial

```bash
REPO_URL='https://SEU_REPOSITORIO.git' REPO_REF='main' bash scripts/install-garden-runv.sh
```

Se usar branch diferente:

```bash
REPO_URL='https://SEU_REPOSITORIO.git' REPO_REF='sua-branch' bash scripts/install-garden-runv.sh
```

## O que o script faz

O script [install-garden-runv.sh](Z:\Códigos\runv-garden\scripts\install-garden-runv.sh):

1. instala Apache, Node, npm, rsync, Certbot e cron
2. valida Node.js 20+
3. baixa ou atualiza o codigo
4. instala dependencias JavaScript
5. gera o build de producao
6. publica o `dist/` em `/var/www/garden.runv.club`
7. cria e ativa o `VirtualHost` do Apache
8. emite SSL valido com Certbot
9. ativa renovacao automatica por `certbot.timer` ou `cron`

## Verificacoes manuais apos o script

Executar no servidor:

```bash
apache2ctl configtest
systemctl status apache2 --no-pager
certbot certificates
systemctl status certbot.timer --no-pager
```

Se o servidor nao usar `certbot.timer`, verificar o cron:

```bash
cat /etc/cron.d/certbot-renew-runv-garden
systemctl status cron --no-pager
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

Ainda nao pronto para producao completa do sistema global:

- persistencia real de plantas
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
