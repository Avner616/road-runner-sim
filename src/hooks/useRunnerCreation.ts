// Road Runner Sim — useRunnerCreation hook
// Bridges RunnerCreationEngine to React. No game logic here.

import { useState, useCallback } from 'react';
import type {
  RunnerProfile,
  Gender,
  RunnerType,
  PreferredEvent,
  AttributeAllocation,
} from '../engine/types/runner';
import {
  rollBaseAttributes,
  initAllocation,
  allocatePoint,
  optimizeForEvent,
  assembleRunner,
  getPointBank,
} from '../engine/RunnerCreationEngine';

export type CreationStep = 'profile' | 'type' | 'attributes' | 'review';

interface ProfileForm {
  name: string;
  gender: Gender;
  age: number;
  nationality: string;
  homeLocation: string;
  avatarUrl?: string;
}

interface UseRunnerCreationReturn {
  step: CreationStep;
  profile: ProfileForm;
  runnerType: RunnerType;
  preferredEvent: PreferredEvent;
  allocation: AttributeAllocation;
  pointBank: number;

  // Step navigation
  goToStep: (step: CreationStep) => void;
  canAdvance: boolean;

  // Profile actions
  updateProfile: (updates: Partial<ProfileForm>) => void;

  // Type / event
  setRunnerType: (type: RunnerType) => void;
  setPreferredEvent: (event: PreferredEvent) => void;

  // Attribute actions
  reroll: () => void;
  adjustPoint: (attr: keyof AttributeAllocation['base'], delta: number) => void;
  optimize: () => void;
  resetPoints: () => void;

  // Final
  createRunner: () => RunnerProfile | null;
}

export function useRunnerCreation(): UseRunnerCreationReturn {
  const [step, setStep] = useState<CreationStep>('profile');
  const [profile, setProfile] = useState<ProfileForm>({
    name: '',
    gender: 'male',
    age: 28,
    nationality: '',
    homeLocation: '',
  });
  const [runnerType, setRunnerTypeState] = useState<RunnerType>('amateur');
  const [preferredEvent, setPreferredEventState] = useState<PreferredEvent>('marathon');

  const [allocation, setAllocation] = useState<AttributeAllocation>(() => {
    const base = rollBaseAttributes('amateur');
    return initAllocation(base, 'amateur');
  });

  const pointBank = getPointBank(runnerType);

  const updateProfile = useCallback((updates: Partial<ProfileForm>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const setRunnerType = useCallback((type: RunnerType) => {
    setRunnerTypeState(type);
    // Re-roll base stats for the new type
    const base = rollBaseAttributes(type);
    setAllocation(initAllocation(base, type));
  }, []);

  const setPreferredEvent = useCallback((event: PreferredEvent) => {
    setPreferredEventState(event);
  }, []);

  const reroll = useCallback(() => {
    const base = rollBaseAttributes(runnerType);
    setAllocation(initAllocation(base, runnerType));
  }, [runnerType]);

  const adjustPoint = useCallback(
    (attr: keyof AttributeAllocation['base'], delta: number) => {
      setAllocation(prev => allocatePoint(prev, attr, delta));
    },
    []
  );

  const optimize = useCallback(() => {
    setAllocation(prev => optimizeForEvent(prev, preferredEvent, runnerType));
  }, [preferredEvent, runnerType]);

  const resetPoints = useCallback(() => {
    setAllocation(prev => initAllocation(prev.base, runnerType));
  }, [runnerType]);

  const canAdvance = (() => {
    if (step === 'profile') {
      return profile.name.trim().length > 0 && profile.nationality.trim().length > 0 && profile.homeLocation.trim().length > 0;
    }
    return true;
  })();

  const goToStep = useCallback((s: CreationStep) => setStep(s), []);

  const createRunner = useCallback((): RunnerProfile | null => {
    if (!profile.name.trim()) return null;
    return assembleRunner({
      name: profile.name.trim(),
      gender: profile.gender,
      age: profile.age,
      nationality: profile.nationality,
      homeLocation: profile.homeLocation,
      avatarUrl: profile.avatarUrl,
      runnerType,
      preferredEvent,
      allocation,
    });
  }, [profile, runnerType, preferredEvent, allocation]);

  return {
    step,
    profile,
    runnerType,
    preferredEvent,
    allocation,
    pointBank,
    goToStep,
    canAdvance,
    updateProfile,
    setRunnerType,
    setPreferredEvent,
    reroll,
    adjustPoint,
    optimize,
    resetPoints,
    createRunner,
  };
}
