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

export interface TrainingSession {
  id: string;
  type: SessionType;
  name: string;
  distance?: number; // km
  duration?: number; // minutes
  notes?: string;
}

// Index 0 = Monday, 6 = Sunday
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeeklyPlan {
  days: TrainingSession[][]; // length 7
}

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
