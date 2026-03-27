# Deploy e Integracao com runv.club

## Objetivo

Servir o front-end em `garden.runv.club` num servidor Debian 13 com Apache, e preparar a integracao futura com o `runv.club` para plantio via comando.

## Front-end

O front atual e totalmente estatico e pode ser publicado como build do Vite.

Comandos:

```bash
npm install
npm run build
```

Saida esperada:

- `dist/`

## Apache no Debian 13

Exemplo de `VirtualHost` para `garden.runv.club`:

```apache
<VirtualHost *:80>
    ServerName garden.runv.club
    ServerAdmin pablomurad@pm.me
    DocumentRoot /var/www/garden.runv.club/dist

    <Directory /var/www/garden.runv.club/dist>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ /index.html [L]

    ErrorLog ${APACHE_LOG_DIR}/garden-error.log
    CustomLog ${APACHE_LOG_DIR}/garden-access.log combined
</VirtualHost>
```

Se houver HTTPS com Certbot, o fluxo recomendado e:

1. publicar o `dist/` em `/var/www/garden.runv.club/dist`
2. ativar o site com `a2ensite`
3. ativar `rewrite` com `a2enmod rewrite`
4. recarregar Apache com `systemctl reload apache2`
5. emitir certificado para `garden.runv.club`

## Comando do runv.club

Comando sugerido:

```text
!plantar [mensagem opcional]
```

Exemplos:

```text
!plantar
!plantar Hoje deixo aqui um gesto de paz.
```

## Regra de negocio

Cada usuario:

- pode plantar 1 planta a cada 24 horas
- recebe uma frase aleatoria do jardim
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
- [src/data\gardenCommands.ts](Z:\Códigos\runv-garden\src\data\gardenCommands.ts)
- [src/data\plantPhrases.ts](Z:\Códigos\runv-garden\src\data\plantPhrases.ts)

## O que precisa de backend real

Para "garantir" a regra de 24h por usuario no `runv.club`, isso precisa sair do browser e ir para o backend ou para o bot do servidor.

Minimo necessario:

1. identificar o usuario real do `runv.club`
2. persistir `username`, `message`, `phrase`, `plantedAt`, `x`, `y`, `sprite`
3. validar cooldown de 24h no servidor
4. expor um endpoint para o front listar as plantas
5. expor um endpoint ou webhook para o comando `!plantar`

## Contrato sugerido

### Criar planta

`POST /api/garden/plants`

```json
{
  "username": "auroramurad",
  "message": "Hoje deixo aqui um gesto de paz."
}
```

Resposta:

```json
{
  "ok": true,
  "plant": {
    "id": "plant_123",
    "creator": "auroramurad",
    "phrase": "O jardim cresce devagar e bonito.",
    "message": "Hoje deixo aqui um gesto de paz.",
    "plantedAt": "2026-03-27T12:00:00Z"
  }
}
```

### Cooldown ativo

```json
{
  "ok": false,
  "reason": "cooldown_active",
  "nextAllowedAt": "2026-03-28T12:00:00Z"
}
```

### Listar plantas

`GET /api/garden/plants`

## Integracao recomendada

Se o `runv.club` ja tiver bot, painel ou servico web:

- o comando `!plantar` deve ser processado la
- a API do jardim deve gravar no banco central
- o front em `garden.runv.club` deve apenas consumir a lista de plantas

Assim o Apache continua servindo o front, e a parte dinamica pode ficar atras de reverse proxy se necessario.
