import type {PlantPreset} from '../types';
import {
  BUSH_SPRITES,
  CACTUS_SPRITES,
  FLOWER_LEAF_SPRITES,
  FLOWER_SPRITES,
  MUSHROOM_SPRITES,
  SPECIAL_SPRITES,
  TREE_SPRITES,
} from './plantParts';

const verdant = 'drop-shadow(0 10px 12px rgba(12, 40, 18, 0.28)) saturate(1.05)';
const rosy = 'drop-shadow(0 10px 14px rgba(67, 24, 47, 0.24)) hue-rotate(18deg) saturate(1.15)';
const amber = 'drop-shadow(0 10px 16px rgba(74, 52, 12, 0.28)) hue-rotate(34deg) saturate(1.2) brightness(1.04)';
const twilight = 'drop-shadow(0 10px 16px rgba(20, 28, 54, 0.3)) hue-rotate(105deg) saturate(1.18)';
const mint = 'drop-shadow(0 10px 16px rgba(20, 60, 55, 0.26)) hue-rotate(-12deg) saturate(1.08)';

export const PLANT_PRESETS: PlantPreset[] = [
  {
    id: 'tree-green',
    category: 'tree',
    rarity: 'common',
    spritePool: TREE_SPRITES,
    scaleRange: [0.62, 0.92],
    shadow: {width: 80, height: 22, opacity: 0.22, blur: 10},
    filters: [verdant, mint],
  },
  {
    id: 'tree-rosy',
    category: 'tree',
    rarity: 'rare',
    spritePool: TREE_SPRITES,
    scaleRange: [0.72, 1.02],
    shadow: {width: 88, height: 24, opacity: 0.24, blur: 12},
    filters: [rosy, amber, twilight],
  },
  {
    id: 'flower-soft',
    category: 'flower',
    rarity: 'common',
    spritePool: FLOWER_SPRITES,
    scaleRange: [1.4, 2.2],
    shadow: {width: 28, height: 10, opacity: 0.18, blur: 6},
    filters: ['saturate(1.05)', 'hue-rotate(8deg) saturate(1.08)', 'hue-rotate(-18deg) saturate(1.1)'],
    leafPool: FLOWER_LEAF_SPRITES,
  },
  {
    id: 'flower-rare',
    category: 'flower',
    rarity: 'rare',
    spritePool: FLOWER_SPRITES,
    scaleRange: [1.9, 2.8],
    shadow: {width: 34, height: 12, opacity: 0.2, blur: 8},
    filters: [rosy, twilight, amber],
    leafPool: FLOWER_LEAF_SPRITES,
  },
  {
    id: 'cactus',
    category: 'cactus',
    rarity: 'common',
    spritePool: CACTUS_SPRITES,
    scaleRange: [0.85, 1.18],
    shadow: {width: 42, height: 14, opacity: 0.2, blur: 7},
    filters: [verdant, 'hue-rotate(10deg) saturate(1.1)', mint],
  },
  {
    id: 'bush',
    category: 'bush',
    rarity: 'common',
    spritePool: BUSH_SPRITES,
    scaleRange: [0.8, 1.22],
    shadow: {width: 48, height: 15, opacity: 0.18, blur: 8},
    filters: [mint, verdant, 'hue-rotate(18deg) saturate(1.12)'],
  },
  {
    id: 'mushroom',
    category: 'mushroom',
    rarity: 'rare',
    spritePool: MUSHROOM_SPRITES,
    scaleRange: [0.34, 0.5],
    shadow: {width: 52, height: 16, opacity: 0.18, blur: 8},
    filters: ['drop-shadow(0 10px 14px rgba(48, 20, 52, 0.24)) saturate(1.06)', twilight, rosy],
  },
  {
    id: 'special-fern',
    category: 'special',
    rarity: 'rare',
    spritePool: SPECIAL_SPRITES,
    scaleRange: [0.78, 1.18],
    shadow: {width: 58, height: 18, opacity: 0.18, blur: 10},
    filters: [mint, twilight, 'hue-rotate(-24deg) saturate(1.15)'],
    glow: 'radial-gradient(circle, rgba(155,255,205,0.35) 0%, rgba(155,255,205,0) 70%)',
    sparkle: true,
  },
];
