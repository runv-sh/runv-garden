import type {PlantInstance} from '../types';
import {fetchFakeGardenPlants} from './fakeGardenBackend';

export const WORLD_SIZE = 4200;

export async function loadGardenWorld(): Promise<{plants: PlantInstance[]; worldSize: number}> {
  const plants = await fetchFakeGardenPlants();
  return {plants, worldSize: WORLD_SIZE};
}
