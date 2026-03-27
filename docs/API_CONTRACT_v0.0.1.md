# API Contract v0.0.1

Versao alvo: `0.0.1`
Dominio do front: `garden.runv.club`
Escopo: contrato sugerido para o backend do `runv.club`

## Regra global

Qualquer usuario do `runv.club` pode usar o comando:

```text
!plantar [mensagem opcional]
```

Regra obrigatoria do servidor:

- 1 planta por usuario a cada 24 horas

## Modelo de planta

```json
{
  "id": "plant_123",
  "creator": "auroramurad",
  "tributeText": null,
  "phrase": "O jardim cresce devagar e bonito.",
  "message": "Hoje deixo aqui um gesto de paz.",
  "plantedAt": "2026-03-27T12:00:00Z",
  "x": 2120,
  "y": 2280,
  "footprint": 140,
  "bonusType": null,
  "composition": {
    "category": "tree",
    "rarity": "common",
    "scale": 1.0,
    "shadow": {
      "width": 80,
      "height": 22,
      "opacity": 0.22,
      "blur": 10
    },
    "swayDuration": 6.2,
    "swayAmplitude": 1.1,
    "layers": [
      {
        "src": "/assets/plants/parts/trees/bodies/pine-01.png",
        "scale": 1,
        "zIndex": 1
      }
    ]
  }
}
```

## Endpoint para listar plantas

`GET /api/garden/plants`

Resposta:

```json
{
  "ok": true,
  "version": "0.0.1",
  "plants": []
}
```

## Endpoint para criar planta

`POST /api/garden/plants`

Body:

```json
{
  "username": "auroramurad",
  "message": "Hoje deixo aqui um gesto de paz."
}
```

Resposta de sucesso:

```json
{
  "ok": true,
  "version": "0.0.1",
  "phrase": "O jardim cresce devagar e bonito.",
  "plant": {
    "id": "plant_123",
    "creator": "auroramurad",
    "phrase": "O jardim cresce devagar e bonito.",
    "message": "Hoje deixo aqui um gesto de paz.",
    "plantedAt": "2026-03-27T12:00:00Z"
  }
}
```

Resposta com cooldown ativo:

```json
{
  "ok": false,
  "version": "0.0.1",
  "reason": "cooldown_active",
  "nextAllowedAt": "2026-03-28T12:00:00Z"
}
```

## Endpoint para consultar cooldown do usuario

`GET /api/garden/plants/cooldown?username=auroramurad`

Resposta:

```json
{
  "ok": true,
  "version": "0.0.1",
  "canPlant": false,
  "nextAllowedAt": "2026-03-28T12:00:00Z"
}
```

## Requisitos de backend

O backend do `runv.club` deve:

1. autenticar ou identificar o usuario real do comando
2. ignorar `username` vindo do cliente quando houver identidade confiavel no servidor
3. gerar a frase aleatoria no servidor
4. validar cooldown de 24h no servidor
5. persistir dados da planta em banco
6. devolver ao front a lista real de plantas

## Observacao sobre a planta central

A planta memorial de Dona Aurora Murad pode continuar fixa no front ou ser devolvida pela API com `tributeText` preenchido. Se vier da API, ela deve ser a unica planta sem nome de usuario no balao.
