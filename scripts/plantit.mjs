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
const HERO_RING_MIN_DISTANCE = 220;
const HERO_RING_MAX_DISTANCE = 980;
const PRESET_POOL = ['flower-soft', 'flower-rare', 'cactus', 'bush', 'mushroom', 'tree-green', 'tree-rosy', 'special-fern'];
const BONUS_POOL = ['7days', '30days', '90days', '180days'];

function printHelp() {
  console.log(`plantit [mensagem opcional]

Exemplos:
  plantit
  plantit Tudo que e belo comeca de algum lugar!

Regras:
  - 1 planta por usuario Linux a cada 24 horas
  - o nome exibido no site vem do usuario Linux que executou o comando
  - a planta vai para o garden.runv.club
  - novas plantas crescem ao redor da homenagem central
  - o sistema evita sobreposicao entre plantas
  - a mensagem e opcional`);
}

function ensureSecureExecution() {
  if (typeof process.getuid === 'function' && process.getuid() !== 0) {
    throw new Error('Use o comando global plantit instalado pelo deploy.');
  }
}

function getUsername() {
  const raw = process.env.SUDO_USER || (typeof process.getuid === 'function' && process.getuid() === 0 ? 'root' : os.userInfo().username);
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 32) || 'anon';
}

function sanitizeMessage(value) {
  const compact = value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const cleaned = compact.replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, '');
  return cleaned.slice(0, MAX_MESSAGE_LENGTH) || undefined;
}

function formatRemainingTime(targetDate, now) {
  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
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

function getPlantRadius(plant) {
  if (plant.id === HERO_ID || plant.bonusType === '365days') {
    return 250;
  }

  switch (plant.presetId) {
    case 'tree-green':
    case 'tree-rosy':
      return 170;
    case 'special-fern':
      return 150;
    case 'bush':
      return 130;
    case 'cactus':
      return 105;
    case 'mushroom':
      return 90;
    case 'flower-rare':
      return 96;
    case 'flower-soft':
      return 82;
    default:
      break;
  }

  switch (plant.bonusType) {
    case '180days':
      return 165;
    case '90days':
      return 185;
    case '30days':
      return 105;
    case '7days':
      return 96;
    default:
      return 120;
  }
}

function getCandidateRadius(seed) {
  if (ratio(seed, 71) > 0.8) {
    const bonusType = BONUS_POOL[Math.floor(ratio(seed, 72) * BONUS_POOL.length)];
    switch (bonusType) {
      case '180days':
        return 165;
      case '90days':
        return 185;
      case '30days':
        return 105;
      case '7days':
        return 96;
      default:
        return 120;
    }
  }

  const presetId = PRESET_POOL[Math.floor(ratio(seed, 73) * PRESET_POOL.length)];
  switch (presetId) {
    case 'tree-green':
    case 'tree-rosy':
      return 170;
    case 'special-fern':
      return 150;
    case 'bush':
      return 130;
    case 'cactus':
      return 105;
    case 'mushroom':
      return 90;
    case 'flower-rare':
      return 96;
    case 'flower-soft':
      return 82;
    default:
      return 120;
  }
}

function getClearance(candidate, plants, candidateRadius) {
  return plants.reduce((min, plant) => {
    const requiredGap = candidateRadius + getPlantRadius(plant) + 24;
    return Math.min(min, distance(candidate, plant) - requiredGap);
  }, Infinity);
}

function pickPosition(plants, seed) {
  const hero = plants.find((plant) => plant.id === HERO_ID);
  const margin = 240;
  const center = hero ? {x: hero.x, y: hero.y} : {x: WORLD_SIZE / 2, y: WORLD_SIZE / 2};
  const candidateRadius = getCandidateRadius(seed);
  let best = center;
  let bestScore = -Infinity;
  const idealRadius = (HERO_RING_MIN_DISTANCE + HERO_RING_MAX_DISTANCE) / 2;

  for (let attempt = 0; attempt < 720; attempt += 1) {
    const angle = ratio(seed, attempt + 1) * Math.PI * 2;
    const radius = HERO_RING_MIN_DISTANCE + ratio(seed, attempt + 501) * (HERO_RING_MAX_DISTANCE - HERO_RING_MIN_DISTANCE);
    const x = Math.round(Math.max(margin, Math.min(WORLD_SIZE - margin, center.x + Math.cos(angle) * radius)));
    const y = Math.round(Math.max(margin, Math.min(WORLD_SIZE - margin, center.y + Math.sin(angle) * radius)));
    const candidate = {x, y};

    const clearance = getClearance(candidate, plants, candidateRadius);
    const heroDistance = hero ? distance(candidate, hero) : distance(candidate, center);
    const edgeDistance = Math.min(x, y, WORLD_SIZE - x, WORLD_SIZE - y);
    const ringDistance = Math.abs(heroDistance - idealRadius);
    const score = Math.min(clearance * 2.2, edgeDistance * 1.1, HERO_RING_MAX_DISTANCE - ringDistance);

    if (heroDistance < HERO_RING_MIN_DISTANCE || heroDistance > HERO_RING_MAX_DISTANCE) {
      continue;
    }

    if (clearance >= 0) {
      return candidate;
    }

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Diretorio de dados nao encontrado em ${DATA_DIR}.`);
  }

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Arquivo do jardim nao encontrado em ${DATA_FILE}.`);
  }

  const dirStat = fs.statSync(DATA_DIR);
  const fileStat = fs.statSync(DATA_FILE);
  if (dirStat.uid !== 0 || fileStat.uid !== 0) {
    throw new Error('Os dados do jardim precisam pertencer ao root para manter a seguranca do comando.');
  }
}

function readGarden() {
  ensureDataFiles();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeGarden(payload) {
  const tempFile = path.join(DATA_DIR, `garden-plants.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
  fs.chownSync(DATA_FILE, 0, 0);
  fs.chmodSync(DATA_FILE, 0o644);
}

function lock() {
  const startedAt = Date.now();
  while (true) {
    try {
      fs.mkdirSync(LOCK_DIR, {mode: 0o700});
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
    message,
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

  ensureSecureExecution();

  const username = getUsername();
  const message = sanitizeMessage(args.join(' '));
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
      console.error(`Tempo restante: ${formatRemainingTime(nextAllowedAt, now)}`);
      process.exit(1);
    }

    const record = createPlantRecord(payload.plants, username, message, now);
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