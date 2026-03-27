const range = (prefix: string, start: number, end: number) =>
  Array.from({length: end - start + 1}, (_, index) => `${prefix}${start + index}.png`);

export const TREE_SPRITES = [
  ...range('/assets/plants/parts/trees/bodies/pine-0', 1, 8),
  '/assets/plants/parts/cacti/bodies/desert-01.png',
  '/assets/plants/parts/cacti/bodies/desert-06.png',
];

export const FLOWER_SPRITES = range('/assets/plants/parts/flowers/blooms/', 1, 74);

export const FLOWER_LEAF_SPRITES = range('/assets/plants/parts/flowers/leaves/leaf-0', 1, 4);

export const CACTUS_SPRITES = [
  '/assets/plants/parts/cacti/bodies/desert-02.png',
  '/assets/plants/parts/cacti/bodies/desert-07.png',
  '/assets/plants/parts/cacti/bodies/desert-12.png',
  '/assets/plants/parts/cacti/bodies/desert-14.png',
];

export const BUSH_SPRITES = [
  '/assets/plants/parts/cacti/bodies/desert-11.png',
  '/assets/plants/parts/cacti/bodies/desert-17.png',
  '/assets/plants/parts/special/ferns/fern-03.png',
  '/assets/plants/parts/special/ferns/fern-04.png',
  '/assets/plants/parts/special/ferns/fern-05.png',
  '/assets/plants/parts/special/ferns/fern-06.png',
];

export const MUSHROOM_SPRITES = [
  '/assets/plants/parts/mushrooms/bodies/shroom-02.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-03.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-04.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-14.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-17.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-44.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-45.png',
  '/assets/plants/parts/mushrooms/bodies/shroom-46.png',
];

export const SPECIAL_SPRITES = [
  ...range('/assets/plants/parts/special/ferns/fern-', 1, 12),
  '/assets/plants/parts/cacti/bodies/desert-01.png',
  '/assets/plants/parts/cacti/bodies/desert-06.png',
  '/assets/plants/parts/special/veteran_rewards/world-tree.png',
];
