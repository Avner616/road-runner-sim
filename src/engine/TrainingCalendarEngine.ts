// Road Runner Sim — TrainingCalendarEngine
// Pure TypeScript. Zero UI imports. All calendar logic lives here.

import type { TrainingSession, WeeklyPlan, SessionEntry, SessionStep, SessionPreset, DayOfWeek } from './types/training';
import { isRepeatBlock } from './types/training';

// ─── Utility ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function reId(entry: SessionEntry): SessionEntry {
  if (isRepeatBlock(entry)) {
    return { ...entry, id: generateId(), steps: entry.steps.map(s => ({ ...s, id: generateId() })) };
  }
  return { ...entry, id: generateId() };
}

// ─── Plan construction ────────────────────────────────────────────────────────

export function createEmptyWeeklyPlan(): WeeklyPlan {
  return { days: Array.from({ length: 7 }, () => []) };
}

export function createSessionFromPreset(preset: SessionPreset): TrainingSession {
  return {
    id:       generateId(),
    type:     preset.type,
    name:     preset.name,
    steps:    preset.steps.map(reId),
    presetId: preset.id,
  };
}

export function createSessionFromBuilder(params: {
  type: TrainingSession['type'];
  name: string;
  steps: SessionEntry[];
  notes?: string;
}): TrainingSession {
  return {
    id:    generateId(),
    type:  params.type,
    name:  params.name,
    steps: params.steps,
    notes: params.notes || undefined,
  };
}

// ─── Immutable plan operations ────────────────────────────────────────────────

export function addSessionToDay(plan: WeeklyPlan, day: DayOfWeek, session: TrainingSession): WeeklyPlan {
  return { days: plan.days.map((d, i) => (i === day ? [...d, session] : d)) };
}

export function removeSessionFromDay(plan: WeeklyPlan, day: DayOfWeek, sessionId: string): WeeklyPlan {
  return { days: plan.days.map((d, i) => (i === day ? d.filter(s => s.id !== sessionId) : d)) };
}

export function moveSession(plan: WeeklyPlan, fromDay: DayOfWeek, toDay: DayOfWeek, sessionId: string): WeeklyPlan {
  if (fromDay === toDay) return plan;
  const session = plan.days[fromDay].find(s => s.id === sessionId);
  if (!session) return plan;
  return {
    days: plan.days.map((d, i) => {
      if (i === fromDay) return d.filter(s => s.id !== sessionId);
      if (i === toDay)   return [...d, session];
      return d;
    }),
  };
}

// ─── Step formatting ──────────────────────────────────────────────────────────

// Label abbreviations used in step summaries
const STEP_ABBR: Record<string, string> = {
  'Warm Up':       'WU',
  'Cool Down':     'CD',
  'Recovery':      'Rec',
  'Work':          '',
  'Easy':          '',
  'Tempo':         '',
  'Marathon Pace': 'MP',
  'Race Pace':     'RP',
  'Surge':         '',
  'Hill':          '',
  'Walk':          '',
  'Rest':          '',
  'Core':          '',
  'Stretching':    'Str',
  'Squats':        '',
  'Lunges':        '',
  'Hip Thrusts':   '',
  'Plank':         '',
  'Easy Jog':      '',
};

export function formatStepDuration(step: SessionStep): string {
  if (step.durationType === 'distance') {
    return step.durationValue < 1
      ? `${Math.round(step.durationValue * 1000)}m`
      : `${step.durationValue}km`;
  }
  const min = step.durationValue;
  if (min === 0) return '—';
  if (Number.isInteger(min)) return `${min}min`;
  const m = Math.floor(min);
  const s = Math.round((min - m) * 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function formatStep(step: SessionStep, omitLabel = false): string {
  const dur = formatStepDuration(step);
  if (omitLabel) return dur;
  const abbr = step.label in STEP_ABBR ? STEP_ABBR[step.label] : step.label;
  return abbr ? `${dur} ${abbr}` : dur;
}

export function summarizeSteps(steps: SessionEntry[]): string {
  if (steps.length === 0) return '—';
  return steps
    .map(entry => {
      if (isRepeatBlock(entry)) {
        if (entry.steps.length === 0) return `${entry.reps}×?`;
        if (entry.steps.length === 1)  return `${entry.reps}×${formatStep(entry.steps[0], true)}`;
        return `${entry.reps}×(${entry.steps.map(s => formatStep(s)).join(' + ')})`;
      }
      return formatStep(entry);
    })
    .join(' + ');
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function computeTotalDistanceKm(steps: SessionEntry[]): number {
  let total = 0;
  for (const entry of steps) {
    if (isRepeatBlock(entry)) {
      for (const s of entry.steps) {
        if (s.durationType === 'distance') total += s.durationValue * entry.reps;
      }
    } else if (entry.durationType === 'distance') {
      total += entry.durationValue;
    }
  }
  return Math.round(total * 10) / 10;
}

export function computeTotalDurationMin(steps: SessionEntry[]): number {
  let total = 0;
  for (const entry of steps) {
    if (isRepeatBlock(entry)) {
      for (const s of entry.steps) {
        if (s.durationType === 'time') total += s.durationValue * entry.reps;
      }
    } else if (entry.durationType === 'time') {
      total += entry.durationValue;
    }
  }
  return Math.round(total);
}

export function totalDistanceForWeek(plan: WeeklyPlan): number {
  return plan.days.flat().reduce((sum, s) => sum + computeTotalDistanceKm(s.steps), 0);
}

export function totalDurationForWeek(plan: WeeklyPlan): number {
  return plan.days.flat().reduce((sum, s) => sum + computeTotalDurationMin(s.steps), 0);
}
