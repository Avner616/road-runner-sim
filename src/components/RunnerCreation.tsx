// Road Runner Sim — RunnerCreation.tsx
// Full runner creation screen. Consumes useRunnerCreation hook only — no engine imports.

import React, { useRef } from 'react';
import { useRunnerCreation } from '../hooks/useRunnerCreation';
import type { CreationStep } from '../hooks/useRunnerCreation';
import type { Gender, RunnerType, PreferredEvent, AttributeAllocation } from '../engine/types/runner';
import { ATTRIBUTE_KEYS, ATTRIBUTE_DESCRIPTIONS, PEAK_WINDOWS } from '../engine/types/runner';
import { getPeakStatus } from '../engine/RunnerCreationEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: { id: CreationStep; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'type', label: 'Runner Type' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'review', label: 'Review' },
];

const EVENT_LABELS: Record<PreferredEvent, string> = {
  '5k': '5K',
  '10k': '10K',
  'half': 'Half Marathon',
  'marathon': 'Marathon',
};

const ATTR_LABELS: Record<string, string> = {
  endurance: 'Endurance',
  speed: 'Speed',
  durability: 'Durability',
  mentality: 'Mentality',
  recoverability: 'Recoverability',
};

const NATIONALITIES = [
  'American', 'Australian', 'Belarusian', 'Brazilian', 'British', 'Canadian',
  'Chinese', 'Dutch', 'Ethiopian', 'French', 'German', 'Israeli',
  'Italian', 'Japanese', 'Kenyan', 'Mexican', 'Norwegian', 'Polish',
  'Portuguese', 'Russian', 'South African', 'Spanish', 'Swedish', 'Ugandan',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, onNavigate }: { current: CreationStep; onNavigate: (s: CreationStep) => void }) {
  const currentIndex = STEPS.findIndex(s => s.id === current);

  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const isActive = step.id === current;
        const isDone = i < currentIndex;
        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isDone && onNavigate(step.id)}
              className={[
                'flex flex-col items-center gap-1 px-3 py-1 rounded transition-opacity',
                isDone ? 'cursor-pointer opacity-100' : 'cursor-default',
                !isDone && !isActive ? 'opacity-40' : 'opacity-100',
              ].join(' ')}
            >
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                isActive
                  ? 'bg-orange-500 text-white'
                  : isDone
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500',
              ].join(' ')}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={[
                'text-xs whitespace-nowrap',
                isActive ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400',
              ].join(' ')}>
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={[
                'flex-1 h-px mb-4 transition-colors',
                i < currentIndex ? 'bg-orange-300 dark:bg-orange-700' : 'bg-zinc-200 dark:bg-zinc-700',
              ].join(' ')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AttributeBar({ value, base, max = 10 }: { value: number; base: number; max?: number }) {
  const baseWidth = (base / max) * 100;
  const addedWidth = ((value - base) / max) * 100;

  return (
    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
      <div
        className="h-full bg-orange-400 rounded-full transition-all duration-300"
        style={{ width: `${baseWidth}%` }}
      />
      {addedWidth > 0 && (
        <div
          className="h-full bg-orange-600 rounded-full transition-all duration-300"
          style={{ width: `${addedWidth}%` }}
        />
      )}
    </div>
  );
}

function AttributeRow({
  attr,
  allocation,
  onAdjust,
}: {
  attr: keyof AttributeAllocation['base'];
  allocation: AttributeAllocation;
  onAdjust: (attr: keyof AttributeAllocation['base'], delta: number) => void;
}) {
  const total = allocation.total[attr];
  const base = allocation.base[attr];
  const spent = allocation.pointsSpent[attr];
  const canAdd = allocation.pointsRemaining > 0 && total < 10;
  const canSub = spent > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {ATTR_LABELS[attr]}
          </span>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
            {ATTRIBUTE_DESCRIPTIONS[attr]}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <button
            onClick={() => onAdjust(attr, -1)}
            disabled={!canSub}
            className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            −
          </button>
          <span className="w-14 text-center">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{total}</span>
            {spent > 0 && (
              <span className="text-xs text-orange-500 ml-1">+{spent}</span>
            )}
          </span>
          <button
            onClick={() => onAdjust(attr, +1)}
            disabled={!canAdd}
            className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            +
          </button>
        </div>
      </div>
      <AttributeBar value={total} base={base} />
    </div>
  );
}

function PeakStatusBadge({ age, event }: { age: number; event: PreferredEvent }) {
  const status = getPeakStatus(age, event);
  const peak = PEAK_WINDOWS[event];

  const config = {
    'pre-peak': { label: 'Pre-peak', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    'peak': { label: '⚡ Peak window', classes: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    'post-peak': { label: 'Post-peak', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    'masters': { label: 'Masters', classes: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  };

  const { label, classes } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {label}
      <span className="opacity-60">
        {EVENT_LABELS[event]} peak: {peak.start}–{peak.end}
      </span>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function ProfileStep({ profile, onUpdate }: {
  profile: ReturnType<typeof useRunnerCreation>['profile'];
  onUpdate: ReturnType<typeof useRunnerCreation>['updateProfile'];
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({ avatarUrl: url });
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-start gap-5">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors shrink-0 overflow-hidden"
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <>
              <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-zinc-400 text-center leading-tight px-1">Upload photo</span>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Runner Name *
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="Enter runner name"
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition-shadow"
          />
        </div>
      </div>

      {/* Gender + Age */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['male', 'female', 'non-binary'] as Gender[]).map(g => (
              <button
                key={g}
                onClick={() => onUpdate({ gender: g })}
                className={[
                  'py-2 rounded-lg border text-xs font-medium capitalize transition-colors',
                  profile.gender === g
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300',
                ].join(' ')}
              >
                {g === 'non-binary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Age — {profile.age} years old
          </label>
          <input
            type="range"
            min={16}
            max={75}
            step={1}
            value={profile.age}
            onChange={e => onUpdate({ age: parseInt(e.target.value) })}
            className="w-full accent-orange-500 mt-3"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>16</span>
            <span>75</span>
          </div>
        </div>
      </div>

      {/* Nationality + Home Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Nationality *
          </label>
          <select
            value={profile.nationality}
            onChange={e => onUpdate({ nationality: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition-shadow"
          >
            <option value="">Select nationality</option>
            {NATIONALITIES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Home Location *
          </label>
          <input
            type="text"
            value={profile.homeLocation}
            onChange={e => onUpdate({ homeLocation: e.target.value })}
            placeholder="e.g. Warsaw, Poland"
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition-shadow"
          />
          <p className="text-xs text-zinc-400">Affects climate, local race scene, and available facilities.</p>
        </div>
      </div>
    </div>
  );
}

function RunnerTypeStep({
  runnerType,
  preferredEvent,
  age,
  onSetType,
  onSetEvent,
}: {
  runnerType: RunnerType;
  preferredEvent: PreferredEvent;
  age: number;
  onSetType: (t: RunnerType) => void;
  onSetEvent: (e: PreferredEvent) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Runner type */}
      <div className="space-y-3">
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Runner type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              id: 'amateur' as RunnerType,
              title: 'Amateur',
              desc: 'Lower starting base. Broad race access via lottery and qualifying times. Can transition to elite through performance.',
              badge: 'Recommended',
            },
            {
              id: 'elite' as RunnerType,
              title: 'Elite',
              desc: 'Higher attribute base. Rivals system active from day one. Open race access and appearance fees.',
              badge: null,
            },
          ]).map(option => (
            <button
              key={option.id}
              onClick={() => onSetType(option.id)}
              className={[
                'p-4 rounded-xl border-2 text-left transition-all',
                runnerType === option.id
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{option.title}</span>
                {option.badge && (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {option.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred event */}
      <div className="space-y-3">
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Preferred event
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['5k', '10k', 'half', 'marathon'] as PreferredEvent[]).map(event => {
            const peak = PEAK_WINDOWS[event];
            return (
              <button
                key={event}
                onClick={() => onSetEvent(event)}
                className={[
                  'p-3 rounded-xl border-2 text-center transition-all',
                  preferredEvent === event
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300',
                ].join(' ')}
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  {EVENT_LABELS[event]}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Peak {peak.start}–{peak.end}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <PeakStatusBadge age={age} event={preferredEvent} />
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This shapes the "Optimize for event" suggestion during attribute allocation. You're not locked in.
        </p>
      </div>
    </div>
  );
}

function AttributesStep({
  allocation,
  preferredEvent,
  runnerType,
  onAdjust,
  onReroll,
  onOptimize,
  onReset,
}: {
  allocation: AttributeAllocation;
  preferredEvent: PreferredEvent;
  runnerType: RunnerType;
  onAdjust: (attr: keyof AttributeAllocation['base'], delta: number) => void;
  onReroll: () => void;
  onOptimize: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Points bank */}
      <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Point bank
          </span>
          <p className="text-xs text-zinc-400 mt-0.5">
            {runnerType === 'elite' ? 'Elite: 12 points' : 'Amateur: 10 points'} to distribute
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tabular-nums ${allocation.pointsRemaining === 0 ? 'text-green-600' : 'text-orange-500'}`}>
            {allocation.pointsRemaining}
          </span>
          <span className="text-sm text-zinc-400">remaining</span>
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-5">
        {ATTRIBUTE_KEYS.map(attr => (
          <AttributeRow
            key={attr}
            attr={attr}
            allocation={allocation}
            onAdjust={onAdjust}
          />
        ))}
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={onReroll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reroll base stats
        </button>

        <button
          onClick={onOptimize}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-orange-300 dark:border-orange-700 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Optimize for {EVENT_LABELS[preferredEvent]}
        </button>

        {Object.values(allocation.pointsSpent).some(v => v > 0) && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Reset points
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Base stats shown in light orange. Your allocated points in dark orange. Reroll as many times as you want — allocation resets each time.
      </p>
    </div>
  );
}

function ReviewStep({
  profile,
  runnerType,
  preferredEvent,
  allocation,
}: {
  profile: ReturnType<typeof useRunnerCreation>['profile'];
  runnerType: RunnerType;
  preferredEvent: PreferredEvent;
  allocation: AttributeAllocation;
}) {
  return (
    <div className="space-y-6">
      {/* Runner card */}
      <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-orange-500">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">{profile.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {profile.age} · {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} · {profile.nationality}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{profile.homeLocation}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full capitalize">
              {runnerType}
            </span>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
              {EVENT_LABELS[preferredEvent]}
            </span>
            <PeakStatusBadge age={profile.age} event={preferredEvent} />
          </div>
        </div>
      </div>

      {/* Final attributes */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Final attributes
        </h4>
        {ATTRIBUTE_KEYS.map(attr => (
          <div key={attr} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{ATTR_LABELS[attr]}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {allocation.total[attr]}
                {allocation.pointsSpent[attr] > 0 && (
                  <span className="text-orange-400 text-xs ml-1">+{allocation.pointsSpent[attr]}</span>
                )}
              </span>
            </div>
            <AttributeBar value={allocation.total[attr]} base={allocation.base[attr]} />
          </div>
        ))}
      </div>

      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Hidden potential</strong> has been randomly assigned. It will reveal itself through seasons of training — even an amateur may have an elite ceiling.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RunnerCreationProps {
  onComplete: (runner: ReturnType<typeof useRunnerCreation>['createRunner'] extends () => infer R ? R : never) => void;
}

export function RunnerCreation({ onComplete }: RunnerCreationProps) {
  const {
    step,
    profile,
    runnerType,
    preferredEvent,
    allocation,
    canAdvance,
    goToStep,
    updateProfile,
    setRunnerType,
    setPreferredEvent,
    reroll,
    adjustPoint,
    optimize,
    resetPoints,
    createRunner,
  } = useRunnerCreation();

  const STEP_IDS: CreationStep[] = ['profile', 'type', 'attributes', 'review'];
  const currentIndex = STEP_IDS.indexOf(step);
  const isLast = currentIndex === STEP_IDS.length - 1;

  const handleNext = () => {
    if (isLast) {
      const runner = createRunner();
      if (runner) onComplete(runner as any);
    } else {
      goToStep(STEP_IDS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) goToStep(STEP_IDS[currentIndex - 1]);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-orange-500 font-bold text-lg tracking-tight">ROAD RUNNER SIM</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Create your runner
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Every decision has consequences. Every season tells a different story.
          </p>
        </div>

        <StepIndicator current={step} onNavigate={goToStep} />

        {/* Step content */}
        <div className="min-h-64">
          {step === 'profile' && (
            <ProfileStep profile={profile} onUpdate={updateProfile} />
          )}
          {step === 'type' && (
            <RunnerTypeStep
              runnerType={runnerType}
              preferredEvent={preferredEvent}
              age={profile.age}
              onSetType={setRunnerType}
              onSetEvent={setPreferredEvent}
            />
          )}
          {step === 'attributes' && (
            <AttributesStep
              allocation={allocation}
              preferredEvent={preferredEvent}
              runnerType={runnerType}
              onAdjust={adjustPoint}
              onReroll={reroll}
              onOptimize={optimize}
              onReset={resetPoints}
            />
          )}
          {step === 'review' && (
            <ReviewStep
              profile={profile}
              runnerType={runnerType}
              preferredEvent={preferredEvent}
              allocation={allocation}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className={[
              'px-6 py-2.5 rounded-xl font-medium text-sm transition-all',
              canAdvance
                ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed',
            ].join(' ')}
          >
            {isLast ? '🏃 Start career' : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default RunnerCreation;
