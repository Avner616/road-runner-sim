// Road Runner Sim — Runner Types
// Engine-only: zero UI imports. Safe to migrate server-side.

export type Gender = 'male' | 'female' | 'non-binary';
export type RunnerType = 'elite' | 'amateur';
export type PreferredEvent = '5k' | '10k' | 'half' | 'marathon';

export interface RunnerAttributes {
  endurance: number;      // 1–10: aerobic capacity
  speed: number;          // 1–10: raw pace ceiling
  durability: number;     // 1–10: injury resistance
  mentality: number;      // 1–10: discipline, pain tolerance
  recoverability: number; // 1–10: training absorption
}

export interface HiddenPotential {
  endurance: number;
  speed: number;
  durability: number;
  mentality: number;
  recoverability: number;
}

export interface RunnerProfile {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  nationality: string;
  homeLocation: string;
  avatarUrl?: string;
  runnerType: RunnerType;
  preferredEvent: PreferredEvent;
  attributes: RunnerAttributes;
  hiddenPotential: HiddenPotential; // never shown to player
  fitnessAge: number; // drives performance curve
  createdAt: string;
}

export interface AttributeAllocation {
  base: RunnerAttributes;     // randomized base
  pointsSpent: RunnerAttributes; // player allocation
  total: RunnerAttributes;    // base + pointsSpent
  pointsRemaining: number;
}

// Optimizer suggestions per event — weight factors for point allocation
export const EVENT_ATTRIBUTE_WEIGHTS: Record<PreferredEvent, RunnerAttributes> = {
  '5k': {
    endurance: 1.5,
    speed: 3.0,
    durability: 1.0,
    mentality: 2.0,
    recoverability: 1.5,
  },
  '10k': {
    endurance: 2.5,
    speed: 2.0,
    durability: 1.0,
    mentality: 2.0,
    recoverability: 1.5,
  },
  'half': {
    endurance: 3.0,
    speed: 1.5,
    durability: 1.5,
    mentality: 2.0,
    recoverability: 2.0,
  },
  'marathon': {
    endurance: 3.5,
    speed: 1.0,
    durability: 2.0,
    mentality: 2.0,
    recoverability: 2.5,
  },
};

export const ATTRIBUTE_KEYS: (keyof RunnerAttributes)[] = [
  'endurance',
  'speed',
  'durability',
  'mentality',
  'recoverability',
];

export const ATTRIBUTE_DESCRIPTIONS: Record<keyof RunnerAttributes, string> = {
  endurance: 'Aerobic capacity — how long you sustain effort',
  speed: 'Raw pace ceiling — natural fast-twitch capability',
  durability: 'Injury resistance — structural robustness',
  mentality: 'Discipline and pain tolerance under pressure',
  recoverability: 'How fast you absorb training and bounce back',
};

export const PEAK_WINDOWS: Record<PreferredEvent, { start: number; end: number; declineAt: number }> = {
  '5k':     { start: 22, end: 28, declineAt: 32 },
  '10k':    { start: 23, end: 30, declineAt: 33 },
  'half':   { start: 25, end: 33, declineAt: 37 },
  'marathon': { start: 27, end: 38, declineAt: 42 },
};
