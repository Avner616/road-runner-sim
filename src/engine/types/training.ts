// Road Runner Sim — Training Types
// Engine-only: zero UI imports. Safe to migrate server-side.

export type SessionType =
  | 'easy-run'
  | 'long-run'
  | 'intervals'
  | 'tempo'
  | 'hill-work'
  | 'resistance-training'
  | 'rest';

// ─── Step targets ─────────────────────────────────────────────────────────────

export interface PaceTarget {
  kind: 'pace';
  minSecPerKm: number;
  maxSecPerKm: number;
}

export interface EffortTarget {
  kind: 'effort';
  zone: 1 | 2 | 3 | 4 | 5;
}

export type StepTarget = PaceTarget | EffortTarget;

// ─── Session structure ────────────────────────────────────────────────────────

export interface SessionStep {
  id: string;
  label: string;
  durationType: 'distance' | 'time'; // km | minutes
  durationValue: number;
  target?: StepTarget;
}

export interface RepeatBlock {
  id: string;
  kind: 'repeat';
  reps: number;
  steps: SessionStep[];
}

export type SessionEntry = SessionStep | RepeatBlock;

export function isRepeatBlock(entry: SessionEntry): entry is RepeatBlock {
  return 'kind' in entry;
}

// ─── Preset & session ─────────────────────────────────────────────────────────

export interface SessionPreset {
  id: string;
  type: SessionType;
  name: string;
  description: string;
  steps: SessionEntry[];
}

export interface TrainingSession {
  id: string;
  type: SessionType;
  name: string;
  steps: SessionEntry[];
  notes?: string;
  presetId?: string; // set when created from a library preset
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday

export interface WeeklyPlan {
  days: TrainingSession[][]; // length 7
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SESSION_TYPES: SessionType[] = [
  'easy-run',
  'long-run',
  'intervals',
  'tempo',
  'hill-work',
  'resistance-training',
  'rest',
];

export const SESSION_LABELS: Record<SessionType, string> = {
  'easy-run':            'Easy Run',
  'long-run':            'Long Run',
  'intervals':           'Intervals',
  'tempo':               'Tempo',
  'hill-work':           'Hill Work',
  'resistance-training': 'Resistance Training',
  'rest':                'Rest',
};

export const DAY_LABELS: string[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export const DAY_SHORT: string[] = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
];

export const EFFORT_ZONE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Max',
};

export const COMMON_STEP_LABELS: string[] = [
  'Warm Up', 'Easy', 'Work', 'Tempo', 'Recovery', 'Cool Down',
  'Marathon Pace', 'Race Pace', 'Surge', 'Hill', 'Walk',
  'Squats', 'Lunges', 'Hip Thrusts', 'Plank', 'Core', 'Stretching', 'Rest',
];
