#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DATA_DIR = process.env.RUNV_GARDEN_DATA_DIR || '/var/lib/runv-garden/data';
const DATA_FILE = path.join(DATA_DIR, 'garden-plants.json');
const LOCK_DIR = path.join(DATA_DIR, '.plantit.lock');
const WORLD_SIZE = 4200;
const HERO_ID = 'hero-auroramurad';
const COOLDOWN_HOURS = 24;
const MAX_MESSAGE_LENGTH = 220;
const PRESET_POOL = ['flower-soft', 'flower-rare', 'cactus', 'bush', 'mushroom', 'tree-green', 'tree-rosy', 'special-fern'];
const BONUS_POOL = ['7days', '30days', '90days', '180days'];

function printHelp() {
  console.log(`plantit [mensagem opcional]

Exemplos:
  plantit
  plantit Tudo que e belo comeca de algum lugar!

Regras:
  - 1 planta por usuario a cada 24 horas
  - a planta vai para o garden.runv.club
  - a mensagem e opcional`);
}

function getUsername() {
  const raw = process.env.SUDO_USER || process.env.USER || process.env.LOGNAME || os.userInfo().username;
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 32) || 'anon';
}

function hashSeed(seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function ratio(seed, salt) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pickPosition(plants, seed) {
  const hero = plants.find((plant) => plant.id === HERO_ID);
  const margin = 320;
  let best = {x: WORLD_SIZE / 2, y: WORLD_SIZE / 2};
  let bestScore = -1;

  for (let attempt = 0; attempt < 360; attempt += 1) {
    const x = Math.round(margin + ratio(seed, attempt + 1) * (WORLD_SIZE - margin * 2));
    const y = Math.round(margin + ratio(seed, attempt + 501) * (WORLD_SIZE - margin * 2));
    const candidate = {x, y};

    const nearestPlant = plants.reduce((min, plant) => Math.min(min, distance(candidate, plant)), Infinity);
    const heroDistance = hero ? distance(candidate, hero) : Infinity;
    const edgeDistance = Math.min(x, y, WORLD_SIZE - x, WORLD_SIZE - y);
    const score = Math.min(nearestPlant, heroDistance * 0.9, edgeDistance * 1.2);

    if (heroDistance < 260) {
      continue;
    }

    if (nearestPlant >= 170) {
      return candidate;
    }

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function readGarden() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Arquivo do jardim nao encontrado em ${DATA_FILE}.`);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeGarden(payload) {
  const tempFile = path.join(DATA_DIR, `garden-plants.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

function lock() {
  const startedAt = Date.now();
  while (true) {
    try {
      fs.mkdirSync(LOCK_DIR);
      fs.writeFileSync(path.join(LOCK_DIR, 'owner'), `${process.pid}\n`, 'utf8');
      return;
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }

      if (Date.now() - startedAt > 5000) {
        throw new Error('Nao foi possivel obter lock do jardim. Tente novamente em instantes.');
      }
    }
  }
}

function unlock() {
  fs.rmSync(LOCK_DIR, {recursive: true, force: true});
}

function getLatestUserPlant(plants, username) {
  return plants
    .filter((plant) => plant.id !== HERO_ID && plant.username === username)
    .sort((a, b) => new Date(b.plantedAt).getTime() - new Date(a.plantedAt).getTime())[0];
}

function enforceCooldown(lastPlant, now) {
  if (!lastPlant) {
    return null;
  }

  const previous = new Date(lastPlant.plantedAt).getTime();
  const current = now.getTime();
  const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

  if (Number.isNaN(previous) || current - previous >= cooldownMs) {
    return null;
  }

  return new Date(previous + cooldownMs);
}

function createPlantRecord(plants, username, message, now) {
  const nowIso = now.toISOString();
  const seed = hashSeed(`${username}:${nowIso}:${plants.length}`);
  const position = pickPosition(plants, seed);
  const useBonus = ratio(seed, 71) > 0.8;

  const record = {
    id: `plant-${username}-${now.getTime()}`,
    username,
    message: message || undefined,
    plantedAt: nowIso,
    x: position.x,
    y: position.y,
  };

  if (useBonus) {
    record.bonusType = BONUS_POOL[Math.floor(ratio(seed, 72) * BONUS_POOL.length)];
  } else {
    record.presetId = PRESET_POOL[Math.floor(ratio(seed, 73) * PRESET_POOL.length)];
  }

  return record;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const username = getUsername();
  const message = args.join(' ').trim().slice(0, MAX_MESSAGE_LENGTH);
  const now = new Date();

  lock();
  try {
    const payload = readGarden();
    if (!Array.isArray(payload.plants)) {
      throw new Error('Formato invalido do garden-plants.json.');
    }

    const lastPlant = getLatestUserPlant(payload.plants, username);
    const nextAllowedAt = enforceCooldown(lastPlant, now);
    if (nextAllowedAt) {
      console.error(`Voce ja plantou nas ultimas 24 horas, ${username}.`);
      console.error(`Proximo plantio liberado em: ${nextAllowedAt.toISOString()}`);
      process.exit(1);
    }

    const record = createPlantRecord(payload.plants, username, message || undefined, now);
    payload.plants.push(record);
    writeGarden(payload);

    console.log(`Planta criada para ${username}.`);
    if (message) {
      console.log(`Mensagem: \"${message}\"`);
    }
    console.log(`ID: ${record.id}`);
    console.log(`Posicao: ${record.x}, ${record.y}`);
    console.log('Atualize https://garden.runv.club para ver a nova planta.');
  } finally {
    unlock();
  }
}

main();