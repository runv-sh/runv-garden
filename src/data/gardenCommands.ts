import type {PlantCommandRecord} from '../types';
import {PLANT_PHRASES} from './plantPhrases';

export const PLANT_COMMAND = '!plantar';
export const PLANT_COOLDOWN_HOURS = 24;

export interface PlantCommandResult {
  ok: boolean;
  phrase?: string;
  nextAllowedAt?: string;
  reason?: string;
}

export function pickPhrase(username: string, plantedAt: string) {
  const seed = `${username}:${plantedAt}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return PLANT_PHRASES[hash % PLANT_PHRASES.length];
}

export function validatePlantCooldown(
  existing: PlantCommandRecord | null,
  nowIso: string,
): PlantCommandResult {
  if (!existing) {
    return {ok: true};
  }

  const now = new Date(nowIso).getTime();
  const previous = new Date(existing.plantedAt).getTime();
  const cooldownMs = PLANT_COOLDOWN_HOURS * 60 * 60 * 1000;

  if (Number.isNaN(now) || Number.isNaN(previous) || now - previous >= cooldownMs) {
    return {ok: true};
  }

  return {
    ok: false,
    reason: 'cooldown_active',
    nextAllowedAt: new Date(previous + cooldownMs).toISOString(),
  };
}

export function createPlantCommandRecord(
  username: string,
  message: string | undefined,
  nowIso: string,
  existing: PlantCommandRecord | null,
): PlantCommandResult & {record?: PlantCommandRecord} {
  const cooldown = validatePlantCooldown(existing, nowIso);
  if (!cooldown.ok) {
    return cooldown;
  }

  const cleanMessage = message?.trim() || undefined;
  const phrase = pickPhrase(username, nowIso);

  return {
    ok: true,
    phrase,
    record: {
      username,
      message: cleanMessage,
      plantedAt: nowIso,
    },
  };
}
