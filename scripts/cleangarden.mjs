#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.RUNV_GARDEN_DATA_DIR || '/var/lib/runv-garden/data';
const DATA_FILE = path.join(DATA_DIR, 'garden-plants.json');
const LOCK_DIR = path.join(DATA_DIR, '.plantit.lock');
const HERO_PLANT = {
  id: 'hero-auroramurad',
  username: 'auroramurad',
  tributeText: 'Em sua doce lembranca, Dona Aurora Murad',
  message: 'O comeco do jardim vive em sua memoria.',
  plantedAt: '2026-03-27T00:00:00.000Z',
  x: 2100,
  y: 2220,
  bonusType: '365days',
  presetId: 'special-fern',
};
const ALLOWED_USER = process.env.RUNV_GARDEN_ADMIN_USER || 'pmurad-admin';

function printHelp() {
  console.log(`cleangarden [--reset]\n\nComportamento padrao:\n  - remove lock travado do plantit\n  - valida o JSON do jardim\n  - garante a planta central da homenagem\n  - corrige permissoes do diretorio de dados\n  - cria backup antes de escrever\n\nOpcao destrutiva:\n  --reset    mantem somente a planta central da homenagem`);
}

function ensureRoot() {
  if (typeof process.getuid === 'function' && process.getuid() !== 0) {
    throw new Error('Use o comando cleangarden instalado pelo deploy.');
  }
}

function ensureAllowedUser() {
  const actor = process.env.SUDO_USER || process.env.USER || '';
  if (actor !== ALLOWED_USER) {
    throw new Error('Acesso negado.');
  }
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, {recursive: true, mode: 0o755});
  fs.chownSync(DATA_DIR, 0, 0);
  fs.chmodSync(DATA_DIR, 0o755);
}

function backupFile() {
  if (!fs.existsSync(DATA_FILE)) {
    return null;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(DATA_DIR, `garden-plants.json.bak.${stamp}`);
  fs.copyFileSync(DATA_FILE, backupPath);
  fs.chownSync(backupPath, 0, 0);
  fs.chmodSync(backupPath, 0o600);
  return backupPath;
}

function removeLock() {
  fs.rmSync(LOCK_DIR, {recursive: true, force: true});
}

function readPayload() {
  if (!fs.existsSync(DATA_FILE)) {
    return {version: '0.0.1', plants: [HERO_PLANT]};
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) {
    return {version: '0.0.1', plants: [HERO_PLANT]};
  }

  const parsed = JSON.parse(raw);
  return {
    version: parsed?.version || '0.0.1',
    plants: Array.isArray(parsed?.plants) ? parsed.plants : [HERO_PLANT],
  };
}

function normalizePlants(plants, reset) {
  if (reset) {
    return [HERO_PLANT];
  }

  const seen = new Set();
  const normalized = [];
  let hasHero = false;

  for (const plant of plants) {
    if (!plant || typeof plant !== 'object') {
      continue;
    }

    const id = typeof plant.id === 'string' && plant.id.trim() ? plant.id.trim() : null;
    const username = typeof plant.username === 'string' && plant.username.trim() ? plant.username.trim().toLowerCase() : null;
    const x = Number(plant.x);
    const y = Number(plant.y);
    const plantedAt = typeof plant.plantedAt === 'string' && plant.plantedAt.trim() ? plant.plantedAt : new Date().toISOString();

    if (!id || !username || !Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    const cleanPlant = {
      id,
      username,
      plantedAt,
      x: Math.round(x),
      y: Math.round(y),
    };

    if (typeof plant.message === 'string' && plant.message.trim()) {
      cleanPlant.message = plant.message.trim().slice(0, 220);
    }
    if (typeof plant.tributeText === 'string' && plant.tributeText.trim()) {
      cleanPlant.tributeText = plant.tributeText.trim();
    }
    if (typeof plant.presetId === 'string' && plant.presetId.trim()) {
      cleanPlant.presetId = plant.presetId.trim();
    }
    if (typeof plant.bonusType === 'string' && plant.bonusType.trim()) {
      cleanPlant.bonusType = plant.bonusType.trim();
    }

    if (cleanPlant.id === HERO_PLANT.id) {
      normalized.push({...HERO_PLANT});
      hasHero = true;
      continue;
    }

    normalized.push(cleanPlant);
  }

  if (!hasHero) {
    normalized.unshift({...HERO_PLANT});
  }

  return normalized;
}

function writePayload(payload) {
  const tmp = path.join(DATA_DIR, `garden-plants.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, DATA_FILE);
  fs.chownSync(DATA_FILE, 0, 0);
  fs.chmodSync(DATA_FILE, 0o644);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const reset = args.includes('--reset');
  ensureRoot();
  ensureAllowedUser();
  ensureDataDir();
  const backupPath = backupFile();
  removeLock();
  const payload = readPayload();
  const plants = normalizePlants(payload.plants, reset);
  writePayload({version: payload.version || '0.0.1', plants});

  console.log('Jardim limpo com sucesso.');
  console.log(`Plantas atuais: ${plants.length}`);
  if (backupPath) {
    console.log(`Backup: ${backupPath}`);
  }
  if (reset) {
    console.log('Modo reset aplicado: somente a planta central foi mantida.');
  } else {
    console.log('Lock removido, JSON validado e planta central garantida.');
  }
}

main();