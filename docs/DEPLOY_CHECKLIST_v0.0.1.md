# Deploy Checklist v0.0.1

Versao alvo: `0.0.1`
Dominio alvo: `garden.runv.club`
Servidor alvo: `Debian 13` com `Apache`

## Pre-condicoes

1. `garden.runv.club` ja aponta para o IP publico do servidor.
2. As portas `80/tcp` e `443/tcp` estao liberadas no firewall.
3. O repositorio do projeto esta acessivel por `git clone` no servidor.

## Instalar

```bash
cd /opt/runv-garden
sudo bash scripts/install-garden-runv.sh
```

## Testes uteis

```bash
command -v plantit
plantit --help
```