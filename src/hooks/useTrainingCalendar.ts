// Road Runner Sim — useTrainingCalendar hook
// Bridges TrainingCalendarEngine to React. No game logic here.

import { useState, useCallback } from 'react';
import type { WeeklyPlan, TrainingSession, SessionPreset, DayOfWeek } from '../engine/types/training';
import {
  createEmptyWeeklyPlan,
  addSessionToDay,
  removeSessionFromDay,
  moveSession as engineMoveSession,
} from '../engine/TrainingCalendarEngine';

interface UseTrainingCalendarReturn {
  plan: WeeklyPlan;
  customPresets: SessionPreset[];
  addSession: (day: DayOfWeek, session: TrainingSession) => void;
  removeSession: (day: DayOfWeek, sessionId: string) => void;
  moveSession: (fromDay: DayOfWeek, toDay: DayOfWeek, sessionId: string) => void;
  saveCustomPreset: (preset: SessionPreset) => void;
}

export function useTrainingCalendar(): UseTrainingCalendarReturn {
  const [plan, setPlan] = useState<WeeklyPlan>(createEmptyWeeklyPlan);
  const [customPresets, setCustomPresets] = useState<SessionPreset[]>([]);

  const addSession = useCallback((day: DayOfWeek, session: TrainingSession) => {
    setPlan(prev => addSessionToDay(prev, day, session));
  }, []);

  const removeSession = useCallback((day: DayOfWeek, sessionId: string) => {
    setPlan(prev => removeSessionFromDay(prev, day, sessionId));
  }, []);

  const moveSession = useCallback((fromDay: DayOfWeek, toDay: DayOfWeek, sessionId: string) => {
    setPlan(prev => engineMoveSession(prev, fromDay, toDay, sessionId));
  }, []);

  const saveCustomPreset = useCallback((preset: SessionPreset) => {
    setCustomPresets(prev => [...prev.filter(p => p.id !== preset.id), preset]);
  }, []);

  return { plan, customPresets, addSession, removeSession, moveSession, saveCustomPreset };
}
