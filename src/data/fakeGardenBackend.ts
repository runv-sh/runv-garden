import type {PlantComposition, PlantInstance, PlantLayer, PlantPreset} from '../types';
import {pickPhrase} from './gardenCommands';
import {PLANT_BONUSES} from './plantBonuses';
import {PLANT_PRESETS} from './plantPresets';

interface StoredPlantRecord {
  id: string;
  username: string;
  tributeText?: string;
  message?: string;
  plantedAt: string;
  x: number;
  y: number;
  presetId?: string;
  bonusType?: keyof typeof PLANT_BONUSES;
}

interface StoredGardenPayload {
  version: string;
  plants: StoredPlantRecord[];
}

const presetIndex = new Map(PLANT_PRESETS.map((preset) => [preset.id, preset]));

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function ratio(seed: number, salt: number) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function choose<T>(items: T[], seed: number, salt: number) {
  return items[Math.floor(ratio(seed, salt) * items.length)];
}

function createLeafLayer(seed: number, preset: PlantPreset): PlantLayer | null {
  if (!preset.leafPool || ratio(seed, 9) > 0.72) {
    return null;
  }

  return {
    src: choose(preset.leafPool, seed, 10),
    offsetX: (ratio(seed, 11) - 0.5) * 10,
    offsetY: -4 - ratio(seed, 12) * 6,
    scale: 1.4 + ratio(seed, 13) * 1.2,
    opacity: 0.55 + ratio(seed, 14) * 0.25,
    filter: 'drop-shadow(0 4px 6px rgba(15, 38, 19, 0.2)) saturate(0.95)',
    flipX: ratio(seed, 15) > 0.5,
    zIndex: 0,
  };
}

function buildComposition(record: StoredPlantRecord): PlantComposition {
  const preset =
    (record.bonusType ? PLANT_BONUSES[record.bonusType] : undefined) ??
    (record.presetId ? presetIndex.get(record.presetId) : undefined) ??
    PLANT_PRESETS[0];

  const seed = hashSeed(`${record.username}:${record.plantedAt}:${record.id}`);
  const layers: PlantLayer[] = [];
  const leafLayer = createLeafLayer(seed, preset);

  if (leafLayer) {
    layers.push(leafLayer);
  }

  layers.push({
    src: choose(preset.spritePool, seed, 1),
    scale: 1,
    filter: preset.filters?.length ? choose(preset.filters, seed, 2) : undefined,
    flipX: ratio(seed, 3) > 0.5,
    zIndex: 1,
  });

  if (preset.sparkle && ratio(seed, 4) > 0.35) {
    layers.push({
      src: choose(preset.spritePool, seed, 5),
      offsetX: -8 + ratio(seed, 6) * 16,
      offsetY: -8 - ratio(seed, 7) * 18,
      scale: 0.18 + ratio(seed, 8) * 0.08,
      opacity: 0.12 + ratio(seed, 16) * 0.12,
      filter: 'blur(1px) brightness(1.25)',
      zIndex: 2,
    });
  }

  if (record.id === 'hero-auroramurad') {
    return {
      category: 'special',
      rarity: 'legendary',
      scale: 1.24,
      shadow: {width: 140, height: 36, opacity: 0.28, blur: 16},
      swayDuration: 7.2,
      swayAmplitude: 1.1,
      glow: 'radial-gradient(circle, rgba(255,232,172,0.30) 0%, rgba(179,245,214,0.18) 45%, rgba(179,245,214,0) 76%)',
      sparkle: true,
      layers,
    };
  }

  return {
    category: preset.category,
    rarity: preset.rarity,
    scale: preset.scaleRange[0] + (preset.scaleRange[1] - preset.scaleRange[0]) * ratio(seed, 17),
    shadow: preset.shadow,
    swayDuration: 4.8 + ratio(seed, 18) * 4.6,
    swayAmplitude: 0.7 + ratio(seed, 19) * 1.6,
    layers,
    glow: preset.glow,
    sparkle: preset.sparkle,
  };
}

export async function fetchFakeGardenPlants(): Promise<PlantInstance[]> {
  const response = await fetch('/data/garden-plants.v0.0.1.json');
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o JSON local do jardim.');
  }

  const payload = (await response.json()) as StoredGardenPayload;

  return payload.plants
    .map((record) => {
      const composition = buildComposition(record);
      return {
        id: record.id,
        creator: record.username,
        tributeText: record.tributeText,
        phrase: pickPhrase(record.username, record.plantedAt),
        message: record.message,
        plantedAt: record.plantedAt,
        x: record.x,
        y: record.y,
        footprint: composition.shadow.width,
        composition,
        bonusType: record.bonusType,
      } satisfies PlantInstance;
    })
    .sort((a, b) => a.y - b.y);
}
