// Road Runner Sim — RunnerCreationEngine
// Pure TypeScript. Zero UI imports. All creation logic lives here.

import type {
  RunnerAttributes,
  RunnerProfile,
  HiddenPotential,
  AttributeAllocation,
  PreferredEvent,
  RunnerType,
} from './types/runner';
import {
  EVENT_ATTRIBUTE_WEIGHTS,
  ATTRIBUTE_KEYS,
  PEAK_WINDOWS,
} from './types/runner';

// ─── Base stat ranges ──────────────────────────────────────────────────────────

const BASE_RANGES = {
  elite:   { min: 5, max: 8 },
  amateur: { min: 2, max: 6 },
};

const POINT_BANK = {
  elite:   12,
  amateur: 10,
};

const ATTRIBUTE_CAP = 10;

// ─── Utility ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function generateId(): string {
  return `runner_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Core generation ──────────────────────────────────────────────────────────

export function rollBaseAttributes(runnerType: RunnerType): RunnerAttributes {
  const { min, max } = BASE_RANGES[runnerType];
  return {
    endurance:     randInt(min, max),
    speed:         randInt(min, max),
    durability:    randInt(min, max),
    mentality:     randInt(min, max),
    recoverability: randInt(min, max),
  };
}

export function generateHiddenPotential(): HiddenPotential {
  // Hidden potential is the ceiling each attribute can reach via training.
  // Even an amateur may have elite ceiling — intentional GDD design.
  return {
    endurance:     randInt(6, 10),
    speed:         randInt(6, 10),
    durability:    randInt(5, 10),
    mentality:     randInt(5, 10),
    recoverability: randInt(6, 10),
  };
}

export function initAllocation(
  base: RunnerAttributes,
  runnerType: RunnerType
): AttributeAllocation {
  const zeroed: RunnerAttributes = {
    endurance: 0,
    speed: 0,
    durability: 0,
    mentality: 0,
    recoverability: 0,
  };

  return {
    base,
    pointsSpent: { ...zeroed },
    total: { ...base },
    pointsRemaining: POINT_BANK[runnerType],
  };
}

// ─── Point allocation ─────────────────────────────────────────────────────────

export function allocatePoint(
  allocation: AttributeAllocation,
  attr: keyof RunnerAttributes,
  delta: number // +1 or -1
): AttributeAllocation {
  const current = allocation.pointsSpent[attr];
  const totalCurrent = allocation.total[attr];

  if (delta > 0) {
    if (allocation.pointsRemaining <= 0) return allocation;
    if (totalCurrent >= ATTRIBUTE_CAP) return allocation;
  } else {
    if (current <= 0) return allocation;
  }

  const newSpent = { ...allocation.pointsSpent, [attr]: current + delta };
  const newTotal: RunnerAttributes = {
    endurance:     allocation.base.endurance + newSpent.endurance,
    speed:         allocation.base.speed + newSpent.speed,
    durability:    allocation.base.durability + newSpent.durability,
    mentality:     allocation.base.mentality + newSpent.mentality,
    recoverability: allocation.base.recoverability + newSpent.recoverability,
  };

  const totalSpent = ATTRIBUTE_KEYS.reduce((sum, k) => sum + newSpent[k], 0);

  return {
    base: allocation.base,
    pointsSpent: newSpent,
    total: newTotal,
    pointsRemaining: POINT_BANK[allocation.base.endurance >= BASE_RANGES.elite.min ? 'elite' : 'amateur'] - totalSpent,
  };
}

// ─── Optimize suggestion ──────────────────────────────────────────────────────

export function optimizeForEvent(
  allocation: AttributeAllocation,
  event: PreferredEvent,
  runnerType: RunnerType
): AttributeAllocation {
  const weights = EVENT_ATTRIBUTE_WEIGHTS[event];
  const totalWeight = ATTRIBUTE_KEYS.reduce((s, k) => s + weights[k], 0);
  const bank = POINT_BANK[runnerType];

  // Distribute points proportionally to weights, respecting the cap
  const raw: RunnerAttributes = { endurance: 0, speed: 0, durability: 0, mentality: 0, recoverability: 0 };
  let remaining = bank;

  // Sort by weight descending so high-priority attrs get first pick
  const sorted = [...ATTRIBUTE_KEYS].sort((a, b) => weights[b] - weights[a]);

  for (const attr of sorted) {
    const share = Math.round((weights[attr] / totalWeight) * bank);
    const max = ATTRIBUTE_CAP - allocation.base[attr];
    const give = Math.min(share, max, remaining);
    raw[attr] = give;
    remaining -= give;
  }

  // Distribute leftover to highest-weight attr that still has room
  if (remaining > 0) {
    for (const attr of sorted) {
      const headroom = ATTRIBUTE_CAP - allocation.base[attr] - raw[attr];
      const give = Math.min(remaining, headroom);
      raw[attr] += give;
      remaining -= give;
      if (remaining <= 0) break;
    }
  }

  const total: RunnerAttributes = {
    endurance:     clamp(allocation.base.endurance + raw.endurance, 1, 10),
    speed:         clamp(allocation.base.speed + raw.speed, 1, 10),
    durability:    clamp(allocation.base.durability + raw.durability, 1, 10),
    mentality:     clamp(allocation.base.mentality + raw.mentality, 1, 10),
    recoverability: clamp(allocation.base.recoverability + raw.recoverability, 1, 10),
  };

  return {
    base: allocation.base,
    pointsSpent: raw,
    total,
    pointsRemaining: 0,
  };
}

// ─── Runner assembly ──────────────────────────────────────────────────────────

export function assembleRunner(params: {
  name: string;
  gender: RunnerProfile['gender'];
  age: number;
  nationality: string;
  homeLocation: string;
  avatarUrl?: string;
  runnerType: RunnerType;
  preferredEvent: PreferredEvent;
  allocation: AttributeAllocation;
}): RunnerProfile {
  const { allocation, ...rest } = params;

  return {
    id: generateId(),
    ...rest,
    attributes: allocation.total,
    hiddenPotential: generateHiddenPotential(),
    fitnessAge: deriveFitnessAge(params.age, params.runnerType),
    createdAt: new Date().toISOString(),
  };
}

// ─── Age helpers ──────────────────────────────────────────────────────────────

export function deriveFitnessAge(chronologicalAge: number, runnerType: RunnerType): number {
  // Elites are closer to their chronological age fitness-wise.
  // Amateurs often have untapped potential — fitness age starts behind.
  const offset = runnerType === 'elite' ? 0 : randInt(-3, 0);
  return clamp(chronologicalAge + offset, 18, chronologicalAge);
}

export function getPeakStatus(
  age: number,
  event: PreferredEvent
): 'pre-peak' | 'peak' | 'post-peak' | 'masters' {
  const { start, end, declineAt } = PEAK_WINDOWS[event];
  if (age < start) return 'pre-peak';
  if (age <= end) return 'peak';
  if (age <= declineAt) return 'post-peak';
  return 'masters';
}

export function getPointBank(runnerType: RunnerType): number {
  return POINT_BANK[runnerType];
}
