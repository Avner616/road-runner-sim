// Road Runner Sim — useTrainingCalendar hook
// Bridges TrainingCalendarEngine to React. No game logic here.

import { useState, useCallback } from 'react';
import type { WeeklyPlan, SessionType, DayOfWeek } from '../engine/types/training';
import {
  createEmptyWeeklyPlan,
  createSession,
  addSessionToDay,
  removeSessionFromDay,
  moveSession as engineMoveSession,
} from '../engine/TrainingCalendarEngine';

interface AddSessionParams {
  type: SessionType;
  name?: string;
  distance?: number;
  duration?: number;
  notes?: string;
}

interface UseTrainingCalendarReturn {
  plan: WeeklyPlan;
  addSession: (day: DayOfWeek, params: AddSessionParams) => void;
  removeSession: (day: DayOfWeek, sessionId: string) => void;
  moveSession: (fromDay: DayOfWeek, toDay: DayOfWeek, sessionId: string) => void;
}

export function useTrainingCalendar(): UseTrainingCalendarReturn {
  const [plan, setPlan] = useState<WeeklyPlan>(createEmptyWeeklyPlan);

  const addSession = useCallback((day: DayOfWeek, params: AddSessionParams) => {
    const session = createSession(params);
    setPlan(prev => addSessionToDay(prev, day, session));
  }, []);

  const removeSession = useCallback((day: DayOfWeek, sessionId: string) => {
    setPlan(prev => removeSessionFromDay(prev, day, sessionId));
  }, []);

  const moveSession = useCallback(
    (fromDay: DayOfWeek, toDay: DayOfWeek, sessionId: string) => {
      setPlan(prev => engineMoveSession(prev, fromDay, toDay, sessionId));
    },
    [],
  );

  return { plan, addSession, removeSession, moveSession };
}
