// Road Runner Sim — SessionBuilderModal.tsx
// Two-tab session builder: library picker and custom step builder.

import { useRef, useState, type ReactNode } from 'react';
import type {
  TrainingSession, SessionPreset, SessionEntry, SessionStep,
  RepeatBlock, SessionType, DayOfWeek, StepTarget,
} from '../engine/types/training';
import {
  SESSION_TYPES, SESSION_LABELS, DAY_LABELS,
  EFFORT_ZONE_LABELS, HR_ZONE_LABELS, COMMON_STEP_LABELS, isRepeatBlock,
} from '../engine/types/training';
import { getAllPresets } from '../engine/SessionLibrary';
import {
  createSessionFromPreset, createSessionFromBuilder,
  computeTotalDistanceKm, summarizeSteps, formatStepDuration, formatPace,
} from '../engine/TrainingCalendarEngine';

// ─── Color map (mirrors TrainingCalendar) ─────────────────────────────────────

const TYPE_DOT: Record<SessionType, string> = {
  'easy-run':            'bg-sky-400',
  'long-run':            'bg-indigo-400',
  'intervals':           'bg-orange-400',
  'tempo':               'bg-red-400',
  'hill-work':           'bg-emerald-400',
  'resistance-training': 'bg-purple-400',
  'rest':                'bg-zinc-500',
};

const TYPE_BADGE: Record<SessionType, string> = {
  'easy-run':            'bg-sky-900/70 text-sky-300',
  'long-run':            'bg-indigo-900/70 text-indigo-300',
  'intervals':           'bg-orange-900/70 text-orange-300',
  'tempo':               'bg-red-900/70 text-red-300',
  'hill-work':           'bg-emerald-900/70 text-emerald-300',
  'resistance-training': 'bg-purple-900/70 text-purple-300',
  'rest':                'bg-zinc-700/70 text-zinc-400',
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

let _uid = 0;
function newId(): string { return `b_${Date.now()}_${++_uid}`; }

function parsePaceInput(s: string): number | null {
  const m = s.match(/^(\d+):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function paceToInput(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Shared modal wrapper ─────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-gray-900 shadow-2xl" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Step preview (read-only, used in Library tab) ────────────────────────────

function StepPreviewList({ steps }: { steps: SessionEntry[] }) {
  if (steps.length === 0) return <p className="text-xs text-zinc-500">No steps defined.</p>;
  return (
    <ol className="space-y-1">
      {steps.map(entry => {
        if (isRepeatBlock(entry)) {
          return (
            <li key={entry.id} className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-400">{entry.reps}× repeat</span>
              <ol className="ml-4 space-y-0.5">
                {entry.steps.map(s => (
                  <li key={s.id} className="text-xs text-zinc-300">
                    {s.label} — {formatStepDuration(s)}
                    {s.target && s.target.kind === 'effort' && (
                      <span className="ml-1 text-zinc-500">Zone {s.target.zone}</span>
                    )}
                    {s.target && s.target.kind === 'hr' && (
                      <span className="ml-1 text-zinc-500">HR Z{s.target.zone}</span>
                    )}
                    {s.target && s.target.kind === 'pace' && (
                      <span className="ml-1 text-zinc-500">{formatPace(s.target.minSecPerKm)}–{formatPace(s.target.maxSecPerKm)}</span>
                    )}
                  </li>
                ))}
              </ol>
            </li>
          );
        }
        return (
          <li key={entry.id} className="text-xs text-zinc-300">
            {entry.label} — {formatStepDuration(entry)}
            {entry.target && entry.target.kind === 'effort' && (
              <span className="ml-1 text-zinc-500">Zone {entry.target.zone}</span>
            )}
            {entry.target && entry.target.kind === 'hr' && (
              <span className="ml-1 text-zinc-500">HR Z{entry.target.zone}</span>
            )}
            {entry.target && entry.target.kind === 'pace' && (
              <span className="ml-1 text-zinc-500">{formatPace(entry.target.minSecPerKm)}–{formatPace(entry.target.maxSecPerKm)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Target editor ────────────────────────────────────────────────────────────

function TargetEditor({ target, onChange }: { target?: StepTarget; onChange: (t?: StepTarget) => void }) {
  const kind = target?.kind ?? 'none';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Kind selector */}
      {(['none', 'effort', 'hr', 'pace'] as const).map(k => (
        <button
          key={k}
          type="button"
          onClick={() => {
            if (k === 'none')   onChange(undefined);
            else if (k === 'effort') onChange({ kind: 'effort', zone: 2 });
            else if (k === 'hr')    onChange({ kind: 'hr',     zone: 2 });
            else                    onChange({ kind: 'pace', minSecPerKm: 270, maxSecPerKm: 300 });
          }}
          className={[
            'rounded px-2 py-0.5 text-xs transition-colors',
            kind === k ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white',
          ].join(' ')}
        >
          {k === 'none' ? 'No target' : k === 'hr' ? 'HR zone' : k === 'effort' ? 'Effort' : 'Pace'}
        </button>
      ))}

      {/* Effort zone (1–5) */}
      {target?.kind === 'effort' && (
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map(z => (
            <button
              key={z}
              type="button"
              title={EFFORT_ZONE_LABELS[z]}
              onClick={() => onChange({ kind: 'effort', zone: z })}
              className={[
                'h-6 w-6 rounded text-xs font-bold transition-colors',
                target.zone === z ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
              ].join(' ')}
            >
              {z}
            </button>
          ))}
        </div>
      )}

      {/* HR zone (Joe Friel, 1–5) */}
      {target?.kind === 'hr' && (
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map(z => (
            <button
              key={z}
              type="button"
              title={HR_ZONE_LABELS[z]}
              onClick={() => onChange({ kind: 'hr', zone: z })}
              className={[
                'h-6 w-6 rounded text-xs font-bold transition-colors',
                target.zone === z ? 'bg-rose-500 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
              ].join(' ')}
            >
              {z}
            </button>
          ))}
        </div>
      )}

      {/* Pace range */}
      {target?.kind === 'pace' && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="4:30"
            defaultValue={paceToInput(target.minSecPerKm)}
            onBlur={e => {
              const v = parsePaceInput(e.target.value);
              if (v !== null) onChange({ ...target, minSecPerKm: v });
            }}
            className="w-16 rounded bg-zinc-800 px-2 py-0.5 text-center text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-zinc-500">–</span>
          <input
            type="text"
            placeholder="5:00"
            defaultValue={paceToInput(target.maxSecPerKm)}
            onBlur={e => {
              const v = parsePaceInput(e.target.value);
              if (v !== null) onChange({ ...target, maxSecPerKm: v });
            }}
            className="w-16 rounded bg-zinc-800 px-2 py-0.5 text-center text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-zinc-500">/km</span>
        </div>
      )}
    </div>
  );
}

// ─── Builder step row ─────────────────────────────────────────────────────────

function BuilderStepRow({
  step, onChange, onDelete, onDragStart, onDragOver, onDrop, isDragOver,
}: {
  step: SessionStep;
  onChange: (s: SessionStep) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  isDragOver: boolean;
}) {
  const [showTarget, setShowTarget] = useState(!!step.target);

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      className={['rounded-lg border p-2 transition-colors', isDragOver ? 'border-indigo-500 bg-indigo-950/20' : 'border-zinc-700 bg-zinc-800/50'].join(' ')}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          draggable
          onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
          className="cursor-grab select-none text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        >⠿</div>

        {/* Label */}
        <input
          list="step-labels"
          type="text"
          value={step.label}
          onChange={e => onChange({ ...step, label: e.target.value })}
          className="min-w-0 flex-1 rounded bg-zinc-700 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Step label"
        />
        <datalist id="step-labels">
          {COMMON_STEP_LABELS.map(l => <option key={l} value={l} />)}
        </datalist>

        {/* Duration type toggle */}
        <div className="flex overflow-hidden rounded border border-zinc-600 text-xs">
          {(['distance', 'time'] as const).map(dt => (
            <button
              key={dt}
              type="button"
              onClick={() => onChange({ ...step, durationType: dt })}
              className={['px-2 py-1 transition-colors', step.durationType === dt ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'].join(' ')}
            >
              {dt === 'distance' ? 'km' : 'min'}
            </button>
          ))}
        </div>

        {/* Duration value */}
        <input
          type="number"
          min="0"
          step={step.durationType === 'distance' ? '0.1' : '0.5'}
          value={step.durationValue || ''}
          onChange={e => onChange({ ...step, durationValue: parseFloat(e.target.value) || 0 })}
          className="w-16 rounded bg-zinc-700 px-2 py-1 text-center text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
        />

        {/* Target toggle */}
        <button
          type="button"
          onClick={() => setShowTarget(v => !v)}
          className={['rounded px-2 py-1 text-xs transition-colors', showTarget ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-white'].join(' ')}
        >
          {step.target
            ? step.target.kind === 'effort' ? `Z${step.target.zone}`
              : step.target.kind === 'hr'   ? `HR${step.target.zone}`
              : 'pace'
            : '+ target'}
        </button>

        {/* Delete */}
        <button type="button" onClick={onDelete} className="text-zinc-600 hover:text-red-400 transition-colors">✕</button>
      </div>

      {showTarget && (
        <div className="mt-2 pl-6">
          <TargetEditor target={step.target} onChange={t => onChange({ ...step, target: t })} />
        </div>
      )}
    </div>
  );
}

// ─── Nested step row (inside a repeat block) — has full target editor ─────────

function NestedStepRow({
  step, onChange, onDelete,
}: {
  step: SessionStep;
  onChange: (s: SessionStep) => void;
  onDelete: () => void;
}) {
  const [showTarget, setShowTarget] = useState(!!step.target);

  return (
    <div className="rounded border border-zinc-700 bg-zinc-800 p-1.5">
      <div className="flex items-center gap-2">
        <input
          list="step-labels"
          type="text"
          value={step.label}
          onChange={e => onChange({ ...step, label: e.target.value })}
          className="min-w-0 flex-1 rounded bg-zinc-700 px-2 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Step label"
        />
        <div className="flex overflow-hidden rounded border border-zinc-600 text-xs">
          {(['distance', 'time'] as const).map(dt => (
            <button key={dt} type="button" onClick={() => onChange({ ...step, durationType: dt })}
              className={['px-1.5 py-0.5 transition-colors', step.durationType === dt ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'].join(' ')}>
              {dt === 'distance' ? 'km' : 'min'}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="0"
          step={step.durationType === 'distance' ? '0.1' : '0.5'}
          value={step.durationValue || ''}
          onChange={e => onChange({ ...step, durationValue: parseFloat(e.target.value) || 0 })}
          className="w-14 rounded bg-zinc-700 px-1.5 py-0.5 text-center text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => setShowTarget(v => !v)}
          className={['rounded px-1.5 py-0.5 text-xs transition-colors', showTarget ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-white'].join(' ')}
        >
          {step.target
            ? step.target.kind === 'effort' ? `Z${step.target.zone}`
              : step.target.kind === 'hr'   ? `HR${step.target.zone}`
              : 'pace'
            : '+ target'}
        </button>
        <button type="button" onClick={onDelete} className="text-zinc-600 hover:text-red-400 transition-colors text-xs">✕</button>
      </div>
      {showTarget && (
        <div className="mt-1.5">
          <TargetEditor target={step.target} onChange={t => onChange({ ...step, target: t })} />
        </div>
      )}
    </div>
  );
}

// ─── Builder repeat block row ─────────────────────────────────────────────────

function BuilderRepeatBlockRow({
  block, onChange, onDelete, onDragStart, onDragOver, onDrop, isDragOver,
}: {
  block: RepeatBlock;
  onChange: (b: RepeatBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  isDragOver: boolean;
}) {
  function addStep() {
    onChange({
      ...block,
      steps: [...block.steps, { id: newId(), label: 'Work', durationType: 'distance', durationValue: 1 }],
    });
  }

  function updateStep(i: number, s: SessionStep) {
    onChange({ ...block, steps: block.steps.map((old, idx) => idx === i ? s : old) });
  }

  function removeStep(i: number) {
    onChange({ ...block, steps: block.steps.filter((_, idx) => idx !== i) });
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      className={['rounded-lg border p-2 transition-colors', isDragOver ? 'border-indigo-500 bg-indigo-950/20' : 'border-zinc-600 bg-zinc-800/30'].join(' ')}
    >
      {/* Block header */}
      <div className="flex items-center gap-2 pb-2">
        <div
          draggable
          onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
          className="cursor-grab select-none text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        >⠿</div>
        <span className="text-xs font-semibold text-zinc-400">Repeat ×</span>
        <input
          type="number"
          min="1"
          max="30"
          value={block.reps}
          onChange={e => onChange({ ...block, reps: parseInt(e.target.value) || 1 })}
          className="w-14 rounded bg-zinc-700 px-2 py-1 text-center text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span className="flex-1 text-xs text-zinc-500">{block.steps.length} step{block.steps.length !== 1 ? 's' : ''}</span>
        <button type="button" onClick={onDelete} className="text-zinc-600 hover:text-red-400 transition-colors text-xs">✕ block</button>
      </div>

      {/* Block steps — each has full label / duration / target editor */}
      <div className="ml-5 space-y-1.5">
        {block.steps.map((s, i) => (
          <NestedStepRow
            key={s.id}
            step={s}
            onChange={updated => updateStep(i, updated)}
            onDelete={() => removeStep(i)}
          />
        ))}
        <button type="button" onClick={addStep}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          + add step to block
        </button>
      </div>
    </div>
  );
}

// ─── Library tab ──────────────────────────────────────────────────────────────

function LibraryTab({
  customPresets, onSelect,
}: {
  customPresets: SessionPreset[];
  onSelect: (preset: SessionPreset) => void;
}) {
  const allPresets = [...getAllPresets(), ...customPresets];
  const [typeFilter, setTypeFilter] = useState<SessionType | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance'>('name');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = allPresets
    .filter(p => typeFilter === null || p.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return computeTotalDistanceKm(b.steps) - computeTotalDistanceKm(a.steps);
    });

  const selected = visible.find(p => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setTypeFilter(null)}
          className={['rounded-full px-3 py-1 text-xs font-medium transition-colors', typeFilter === null ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'].join(' ')}
        >
          All
        </button>
        {SESSION_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={['flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors', typeFilter === t ? TYPE_BADGE[t] : 'bg-zinc-800 text-zinc-400 hover:text-white'].join(' ')}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[t]}`} />
            {SESSION_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Sort:</span>
        {(['name', 'distance'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={['rounded px-2 py-0.5 text-xs capitalize transition-colors', sortBy === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Preset list */}
      <div className="flex gap-3 overflow-hidden" style={{ minHeight: 320 }}>
        {/* List */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {visible.length === 0 && <p className="text-xs text-zinc-500 pt-4">No presets for this filter.</p>}
          {visible.map(preset => {
            const km = computeTotalDistanceKm(preset.steps);
            const isSelected = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedId(isSelected ? null : preset.id)}
                className={['w-full rounded-lg border p-3 text-left transition-colors', isSelected ? 'border-indigo-500 bg-indigo-950/30' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-500'].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-white truncate">{preset.name}</span>
                  <span className={['shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', TYPE_BADGE[preset.type]].join(' ')}>
                    {SESSION_LABELS[preset.type]}
                  </span>
                </div>
                {km > 0 && <p className="mt-0.5 text-xs text-zinc-500">{km} km · {summarizeSteps(preset.steps)}</p>}
                {km === 0 && <p className="mt-0.5 text-xs text-zinc-500">{summarizeSteps(preset.steps)}</p>}
              </button>
            );
          })}
        </div>

        {/* Preview panel */}
        {selected && (
          <div className="w-52 shrink-0 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800/40 p-3">
            <p className="mb-1 text-xs font-semibold text-zinc-300">{selected.name}</p>
            <p className="mb-3 text-xs text-zinc-500 leading-relaxed">{selected.description}</p>
            <StepPreviewList steps={selected.steps} />
            <button
              onClick={() => onSelect(selected)}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Add to day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom tab ───────────────────────────────────────────────────────────────

function CustomTab({
  onSaveAndAdd,
}: {
  onSaveAndAdd: (session: TrainingSession, preset: SessionPreset) => void;
}) {
  const [sessionType, setSessionType] = useState<SessionType>('easy-run');
  const [sessionName, setSessionName] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<SessionEntry[]>([]);

  const dragRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function addStep() {
    setEntries(prev => [...prev, { id: newId(), label: 'Work', durationType: 'distance', durationValue: 1 } satisfies SessionStep]);
  }

  function addRepeatBlock() {
    const block: RepeatBlock = {
      id: newId(),
      kind: 'repeat',
      reps: 4,
      steps: [
        { id: newId(), label: 'Work',     durationType: 'distance', durationValue: 1 },
        { id: newId(), label: 'Recovery', durationType: 'distance', durationValue: 0.4 },
      ],
    };
    setEntries(prev => [...prev, block]);
  }

  function updateEntry(i: number, entry: SessionEntry) {
    setEntries(prev => prev.map((e, idx) => idx === i ? entry : e));
  }

  function removeEntry(i: number) {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleDrop(toIdx: number) {
    const fromIdx = dragRef.current;
    if (fromIdx === null || fromIdx === toIdx) { dragRef.current = null; setDragOverIdx(null); return; }
    setEntries(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    dragRef.current = null;
    setDragOverIdx(null);
  }

  function buildSession(): TrainingSession {
    return createSessionFromBuilder({
      type: sessionType,
      name: sessionName.trim() || SESSION_LABELS[sessionType],
      steps: entries,
      notes: notes.trim() || undefined,
    });
  }

  function buildPreset(session: TrainingSession): SessionPreset {
    return {
      id:          `custom_${Date.now()}`,
      type:        session.type,
      name:        session.name,
      description: notes.trim() || 'Custom session.',
      steps:       session.steps,
    };
  }

  function handleSaveAndAdd() {
    const session = buildSession();
    onSaveAndAdd(session, buildPreset(session));
  }

  return (
    // onSubmit prevents Enter-key form submission from triggering page navigation
    <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
      {/* Header fields */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Session name</span>
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder={SESSION_LABELS[sessionType]}
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Type</span>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${TYPE_DOT[sessionType]}`} />
            <select
              value={sessionType}
              onChange={e => setSessionType(e.target.value as SessionType)}
              className="w-full appearance-none rounded-lg bg-gray-800 py-2 pl-8 pr-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SESSION_TYPES.map(t => <option key={t} value={t}>{SESSION_LABELS[t]}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Step builder */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Steps</span>
          {entries.length > 0 && (
            <span className="text-xs text-zinc-500">{summarizeSteps(entries)}</span>
          )}
        </div>

        <div className="space-y-1.5" onDragEnd={() => { dragRef.current = null; setDragOverIdx(null); }}>
          {entries.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-700 py-6 text-center text-xs text-zinc-600">
              No steps yet — add a step or repeat block below.
            </p>
          )}
          {entries.map((entry, i) => {
            const shared = {
              onDragStart: () => { dragRef.current = i; },
              onDragOver:  () => setDragOverIdx(i),
              onDrop:      () => handleDrop(i),
              isDragOver:  dragOverIdx === i,
              onDelete:    () => removeEntry(i),
            };
            if (isRepeatBlock(entry)) {
              return (
                <BuilderRepeatBlockRow
                  key={entry.id}
                  block={entry}
                  onChange={b => updateEntry(i, b)}
                  {...shared}
                />
              );
            }
            return (
              <BuilderStepRow
                key={entry.id}
                step={entry}
                onChange={s => updateEntry(i, s)}
                {...shared}
              />
            );
          })}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={addStep}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          >
            + Add step
          </button>
          <button
            type="button"
            onClick={addRepeatBlock}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          >
            + Add repeat block
          </button>
        </div>
      </div>

      {/* Notes */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes about this session…"
          className="resize-none rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>

      {/* Footer */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveAndAdd}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
        >
          Save preset & add to day
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface SessionBuilderModalProps {
  day: DayOfWeek;
  customPresets: SessionPreset[];
  onAdd: (session: TrainingSession) => void;
  onSavePreset: (preset: SessionPreset) => void;
  onClose: () => void;
}

export function SessionBuilderModal({ day, customPresets, onAdd, onSavePreset, onClose }: SessionBuilderModalProps) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');

  function handleLibrarySelect(preset: SessionPreset) {
    onAdd(createSessionFromPreset(preset));
    onClose();
  }

  function handleCustomSaveAndAdd(session: TrainingSession, preset: SessionPreset) {
    onSavePreset(preset);
    onAdd(session);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <h2 className="font-bold text-white">Add session</h2>
          <p className="text-sm text-zinc-400">{DAY_LABELS[day]}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 px-6">
        {(['library', 'custom'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'mr-6 border-b-2 py-3 text-sm font-medium capitalize transition-colors',
              tab === t ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-white',
            ].join(' ')}
          >
            {t === 'library' ? 'From library' : 'Custom'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'library' ? (
          <LibraryTab customPresets={customPresets} onSelect={handleLibrarySelect} />
        ) : (
          <CustomTab onSaveAndAdd={handleCustomSaveAndAdd} />
        )}
      </div>
    </Modal>
  );
}

export default SessionBuilderModal;
