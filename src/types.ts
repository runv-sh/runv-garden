import React from 'react';

export type Category = 'tree' | 'flower' | 'cactus' | 'bush' | 'mushroom' | 'special';

export interface PlantPart {
  id: string;
  svg: (color: string) => React.ReactNode;
}

export interface PlantComposition {
  category: Category;
  baseId: string;
  bodyId: string;
  detailId?: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  scale: number;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface PlantInstance {
  id: string;
  composition: PlantComposition;
  creator: string;
  x: number; // World coordinates
  y: number;
  bonusType?: '7days' | '30days' | '90days' | '180days' | '365days';
}

export const USERS = [
  '@pmurad', '@ana', '@leo', '@sofia', '@caio', 
  '@maya', '@rui', '@luna', '@noah', '@iris'
];
