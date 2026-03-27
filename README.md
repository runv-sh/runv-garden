# RUNV Garden

Landing page interativa de uma única página para o `runv.club`.
O foco é um mundo-jardim grande, explorável com drag, composto por assets locais e geração procedural leve no front-end.

![RUNV Garden](img/garden.png)

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Motion

## Como correr

1. `npm install`
2. `npm run dev`

Abre em `http://localhost:3000`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run clean`
- `bash scripts/install-garden-runv.sh` no Debian 13 para provisionar deploy + SSL
- `bash scripts/uninstall-garden-runv.sh` no Debian 13 para remover o deploy

## Estrutura relevante

- [public/assets/plants](Z:\Códigos\runv-garden\public\assets\plants): sprites locais extraídos dos packs open source
- [scripts/extract-plant-assets.ps1](Z:\Códigos\runv-garden\scripts\extract-plant-assets.ps1): transforma os sheets baixados em PNGs prontos para uso
- [src/data/plantParts.ts](Z:\Códigos\runv-garden\src\data\plantParts.ts): pools de assets por categoria
- [src/data/plantPresets.ts](Z:\Códigos\runv-garden\src\data\plantPresets.ts): presets visuais
- [src/data/plantBonuses.ts](Z:\Códigos\runv-garden\src\data\plantBonuses.ts): plantas-bônus por tempo de permanência
- [src/data/gardenWorld.ts](Z:\Códigos\runv-garden\src\data\gardenWorld.ts): dados do mapa e planta-hero atual
- [src/data/fakeGardenBackend.ts](Z:\Códigos\runv-garden\src\data\fakeGardenBackend.ts): carregamento do backend fake em JSON local
- [src/data/gardenCommands.ts](Z:\Códigos\runv-garden\src\data\gardenCommands.ts): regra do comando `!plantar` e cooldown de 24h
- [src/data/plantPhrases.ts](Z:\Códigos\runv-garden\src\data\plantPhrases.ts): frases aleatórias do jardim
- [public/data/garden-plants.v0.0.1.json](Z:\Códigos\runv-garden\public\data\garden-plants.v0.0.1.json): plantas simuladas para desenvolvimento local
- [docs/DEPLOY_RUNV_CLUB.md](Z:\Códigos\runv-garden\docs\DEPLOY_RUNV_CLUB.md): guia de deploy para Debian 13 + Apache + integração com o `runv.club`
- [docs/DEPLOY_CHECKLIST_v0.0.1.md](Z:\Códigos\runv-garden\docs\DEPLOY_CHECKLIST_v0.0.1.md): checklist operacional do primeiro deploy da versão 0.0.1
- [docs/API_CONTRACT_v0.0.1.md](Z:\Códigos\runv-garden\docs\API_CONTRACT_v0.0.1.md): contrato sugerido de JSON/API para o backend do `runv.club`

## Notas

- Não há backend.
- Não há runtime de IA.
- Não há dependência de Gemini, Imagen ou API externa para a landing funcionar.
