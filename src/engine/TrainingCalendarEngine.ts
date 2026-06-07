// Road Runner Sim — TrainingCalendarEngine
// Pure TypeScript. Zero UI imports. All calendar logic lives here.

import type { TrainingSession, WeeklyPlan, SessionType, DayOfWeek } from './types/training';
import { SESSION_LABELS } from './types/training';

// ─── Utility ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Plan construction ────────────────────────────────────────────────────────

export function createEmptyWeeklyPlan(): WeeklyPlan {
  return { days: Array.from({ length: 7 }, () => []) };
}

export function createSession(params: {
  type: SessionType;
  name?: string;
  distance?: number;
  duration?: number;
  notes?: string;
}): TrainingSession {
  return {
    id:       generateId(),
    type:     params.type,
    name:     params.name?.trim() || SESSION_LABELS[params.type],
    distance: params.distance,
    duration: params.duration,
    notes:    params.notes?.trim() || undefined,
  };
}

// ─── Immutable plan operations ────────────────────────────────────────────────

export function addSessionToDay(
  plan: WeeklyPlan,
  day: DayOfWeek,
  session: TrainingSession,
): WeeklyPlan {
  return {
    days: plan.days.map((d, i) => (i === day ? [...d, session] : d)),
  };
}

export function removeSessionFromDay(
  plan: WeeklyPlan,
  day: DayOfWeek,
  sessionId: string,
): WeeklyPlan {
  return {
    days: plan.days.map((d, i) => (i === day ? d.filter(s => s.id !== sessionId) : d)),
  };
}

export function moveSession(
  plan: WeeklyPlan,
  fromDay: DayOfWeek,
  toDay: DayOfWeek,
  sessionId: string,
): WeeklyPlan {
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

// ─── Queries ──────────────────────────────────────────────────────────────────

export function totalDistanceForWeek(plan: WeeklyPlan): number {
  return plan.days.flat().reduce((sum, s) => sum + (s.distance ?? 0), 0);
}

export function totalDurationForWeek(plan: WeeklyPlan): number {
  return plan.days.flat().reduce((sum, s) => sum + (s.duration ?? 0), 0);
}
