export type PlantCategory =
  | 'tree'
  | 'flower'
  | 'cactus'
  | 'bush'
  | 'mushroom'
  | 'special';

export type PlantRarity = 'common' | 'rare' | 'legendary';

export type BonusType = '7days' | '30days' | '90days' | '180days' | '365days';

export interface PlantLayer {
  src: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  opacity?: number;
  filter?: string;
  flipX?: boolean;
  zIndex?: number;
}

export interface PlantShadow {
  width: number;
  height: number;
  opacity: number;
  blur: number;
}

export interface PlantComposition {
  category: PlantCategory;
  rarity: PlantRarity;
  scale: number;
  shadow: PlantShadow;
  swayDuration: number;
  swayAmplitude: number;
  layers: PlantLayer[];
  glow?: string;
  sparkle?: boolean;
}

export interface PlantInstance {
  id: string;
  creator: string;
  tributeText?: string;
  phrase?: string;
  message?: string;
  plantedAt?: string;
  x: number;
  y: number;
  footprint: number;
  composition: PlantComposition;
  bonusType?: BonusType;
}

export interface PlantCommandRecord {
  username: string;
  message?: string;
  plantedAt: string;
}

export interface PlantPreset {
  id: string;
  category: PlantCategory;
  rarity: PlantRarity;
  spritePool: string[];
  scaleRange: [number, number];
  shadow: PlantShadow;
  filters?: string[];
  leafPool?: string[];
  glow?: string;
  sparkle?: boolean;
  bonusType?: BonusType;
}
