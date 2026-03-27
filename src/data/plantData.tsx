import React from 'react';
import { Category, PlantComposition } from '../types';

// SVG Parts for modular plants
// Each part is designed on a small grid (e.g. 16x16 or 24x24) to look like pixel art

export const PARTS = {
  tree: {
    bases: [
      { id: 'trunk_thin', svg: (c: string) => <rect x="7" y="12" width="2" height="8" fill={c} /> },
      { id: 'trunk_thick', svg: (c: string) => <rect x="6" y="10" width="4" height="10" fill={c} /> },
      { id: 'trunk_split', svg: (c: string) => <path d="M8 20 L8 14 L5 10 M8 14 L11 10" stroke={c} strokeWidth="2" fill="none" /> },
    ],
    bodies: [
      { id: 'canopy_round', svg: (c: string) => <circle cx="8" cy="8" r="6" fill={c} /> },
      { id: 'canopy_tall', svg: (c: string) => <ellipse cx="8" cy="7" rx="5" ry="7" fill={c} /> },
      { id: 'canopy_layered', svg: (c: string) => (
        <g fill={c}>
          <path d="M8 2 L3 8 L13 8 Z" />
          <path d="M8 6 L2 14 L14 14 Z" />
        </g>
      )},
    ],
    details: [
      { id: 'fruit', svg: (c: string) => <circle cx="6" cy="6" r="1" fill={c} /> },
      { id: 'blossom', svg: (c: string) => <rect x="10" y="8" width="2" height="2" fill={c} /> },
    ]
  },
  flower: {
    bases: [
      { id: 'stem_short', svg: (c: string) => <rect x="7" y="10" width="2" height="6" fill={c} /> },
      { id: 'stem_long', svg: (c: string) => <rect x="7" y="6" width="2" height="10" fill={c} /> },
    ],
    bodies: [
      { id: 'petals_round', svg: (c: string) => <circle cx="8" cy="6" r="4" fill={c} /> },
      { id: 'petals_star', svg: (c: string) => <path d="M8 2 L10 5 L13 6 L10 7 L8 10 L6 7 L3 6 L6 5 Z" fill={c} /> },
    ],
    details: [
      { id: 'center', svg: (c: string) => <circle cx="8" cy="6" r="1.5" fill={c} /> },
    ]
  },
  cactus: {
    bases: [
      { id: 'pot', svg: (c: string) => <rect x="5" y="14" width="6" height="4" fill={c} /> },
      { id: 'ground', svg: (c: string) => <ellipse cx="8" cy="16" rx="6" ry="2" fill={c} /> },
    ],
    bodies: [
      { id: 'body_round', svg: (c: string) => <circle cx="8" cy="10" r="5" fill={c} /> },
      { id: 'body_tall', svg: (c: string) => <rect x="5" y="4" width="6" height="12" fill={c} rx="3" /> },
    ],
    details: [
      { id: 'arms', svg: (c: string) => <path d="M3 10 Q3 14 5 14 M13 8 Q13 12 11 12" stroke={c} strokeWidth="2" fill="none" /> },
    ]
  },
  mushroom: {
    bases: [
      { id: 'stem_thick', svg: (c: string) => <rect x="6" y="10" width="4" height="6" fill={c} /> },
    ],
    bodies: [
      { id: 'cap_wide', svg: (c: string) => <path d="M2 10 Q8 2 14 10 Z" fill={c} /> },
      { id: 'cap_pointy', svg: (c: string) => <path d="M4 10 L8 2 L12 10 Z" fill={c} /> },
    ],
    details: [
      { id: 'spots', svg: (c: string) => (
        <g fill={c}>
          <circle cx="6" cy="6" r="1" />
          <circle cx="10" cy="8" r="1" />
        </g>
      )},
    ]
  }
};

export const PRESETS: PlantComposition[] = [
  {
    category: 'tree',
    baseId: 'trunk_thick',
    bodyId: 'canopy_round',
    colors: { primary: '#4e342e', secondary: '#2e7d32', accent: '#f06292' },
    scale: 1.2,
    rarity: 'common'
  },
  {
    category: 'flower',
    baseId: 'stem_long',
    bodyId: 'petals_round',
    colors: { primary: '#4caf50', secondary: '#e91e63', accent: '#fff176' },
    scale: 0.8,
    rarity: 'common'
  },
  {
    category: 'cactus',
    baseId: 'pot',
    bodyId: 'body_tall',
    colors: { primary: '#795548', secondary: '#1b5e20', accent: '#2e7d32' },
    scale: 1,
    rarity: 'common'
  },
  {
    category: 'mushroom',
    baseId: 'stem_thick',
    bodyId: 'cap_wide',
    colors: { primary: '#eeeeee', secondary: '#d32f2f', accent: '#ffffff' },
    scale: 0.7,
    rarity: 'common'
  },
  // Rare variants
  {
    category: 'tree',
    baseId: 'trunk_split',
    bodyId: 'canopy_layered',
    colors: { primary: '#3e2723', secondary: '#006064', accent: '#80deea' },
    scale: 1.5,
    rarity: 'rare'
  },
  {
    category: 'flower',
    baseId: 'stem_short',
    bodyId: 'petals_star',
    colors: { primary: '#388e3c', secondary: '#7b1fa2', accent: '#e1bee7' },
    scale: 0.9,
    rarity: 'rare'
  }
];

export const BONUS_PLANTS: Record<string, PlantComposition> = {
  '7days': {
    category: 'flower',
    baseId: 'stem_long',
    bodyId: 'petals_star',
    colors: { primary: '#4caf50', secondary: '#ffeb3b', accent: '#ffffff' },
    scale: 1,
    rarity: 'common'
  },
  '30days': {
    category: 'cactus',
    baseId: 'pot',
    bodyId: 'body_round',
    colors: { primary: '#5d4037', secondary: '#2e7d32', accent: '#f48fb1' },
    scale: 1.1,
    rarity: 'rare'
  },
  '90days': {
    category: 'tree',
    baseId: 'trunk_thick',
    bodyId: 'canopy_layered',
    colors: { primary: '#4e342e', secondary: '#fbc02d', accent: '#fff9c4' },
    scale: 1.4,
    rarity: 'rare'
  },
  '365days': {
    category: 'tree',
    baseId: 'trunk_split',
    bodyId: 'canopy_round',
    colors: { primary: '#263238', secondary: '#4527a0', accent: '#b39ddb' },
    scale: 1.8,
    rarity: 'legendary'
  }
};
