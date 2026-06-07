// Road Runner Sim — TrainingCalendar.tsx
// Training calendar screen. Consumes useTrainingCalendar hook only — no engine imports.

import { useRef, useState, type ReactNode } from 'react';
import { useTrainingCalendar } from '../hooks/useTrainingCalendar';
import type { TrainingSession, SessionType, DayOfWeek } from '../engine/types/training';
import {
  SESSION_TYPES,
  SESSION_LABELS,
  DAY_LABELS,
  DAY_SHORT,
  isRepeatBlock,
} from '../engine/types/training';
import { summarizeSteps, computeTotalDistanceKm, formatStepDuration, formatPace } from '../engine/TrainingCalendarEngine';
import { SessionBuilderModal } from './SessionBuilderModal';

// ─── Color map ────────────────────────────────────────────────────────────────

const SESSION_COLORS: Record<SessionType, { card: string; dot: string; badge: string }> = {
  'easy-run':            { card: 'border-sky-700 bg-sky-950/60',        dot: 'bg-sky-400',     badge: 'bg-sky-900/70 text-sky-300' },
  'long-run':            { card: 'border-indigo-700 bg-indigo-950/60',  dot: 'bg-indigo-400',  badge: 'bg-indigo-900/70 text-indigo-300' },
  'intervals':           { card: 'border-orange-700 bg-orange-950/60',  dot: 'bg-orange-400',  badge: 'bg-orange-900/70 text-orange-300' },
  'tempo':               { card: 'border-red-700 bg-red-950/60',        dot: 'bg-red-400',     badge: 'bg-red-900/70 text-red-300' },
  'hill-work':           { card: 'border-emerald-700 bg-emerald-950/60',dot: 'bg-emerald-400', badge: 'bg-emerald-900/70 text-emerald-300' },
  'resistance-training': { card: 'border-purple-700 bg-purple-950/60',  dot: 'bg-purple-400',  badge: 'bg-purple-900/70 text-purple-300' },
  'rest':                { card: 'border-zinc-600 bg-zinc-800/60',       dot: 'bg-zinc-500',    badge: 'bg-zinc-700/70 text-zinc-400' },
};

// ─── Shared modal wrapper ─────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  visible,
  onToggle,
}: {
  visible: Set<SessionType>;
  onToggle: (type: SessionType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pb-4">
      {SESSION_TYPES.map(type => {
        const { dot, badge } = SESSION_COLORS[type];
        const active = visible.has(type);
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity',
              active ? badge : 'bg-zinc-800 text-zinc-500 opacity-50',
            ].join(' ')}
          >
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            {SESSION_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  day,
  onDragStart,
  onClick,
}: {
  session: TrainingSession;
  day: DayOfWeek;
  onDragStart: (sessionId: string, fromDay: DayOfWeek) => void;
  onClick: () => void;
}) {
  const { card, dot } = SESSION_COLORS[session.type];

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(session.id, day);
      }}
      onClick={onClick}
      className={[
        'cursor-grab rounded-lg border p-2 text-left active:cursor-grabbing',
        'transition-opacity hover:opacity-90 select-none',
        card,
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <span className="truncate text-xs font-medium text-white">{session.name}</span>
      </div>
      <p className="mt-0.5 truncate pl-3.5 text-xs text-zinc-400">{summarizeSteps(session.steps)}</p>
    </div>
  );
}

// ─── Day column ───────────────────────────────────────────────────────────────

function DayColumn({
  day,
  sessions,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddClick,
  onSessionDragStart,
  onSessionClick,
}: {
  day: DayOfWeek;
  sessions: TrainingSession[];
  isDragOver: boolean;
  onDragOver: (day: DayOfWeek) => void;
  onDragLeave: () => void;
  onDrop: (day: DayOfWeek) => void;
  onAddClick: (day: DayOfWeek) => void;
  onSessionDragStart: (sessionId: string, fromDay: DayOfWeek) => void;
  onSessionClick: (session: TrainingSession, day: DayOfWeek) => void;
}) {
  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(day); }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(day); }}
      className={[
        'flex min-h-40 flex-col gap-1.5 rounded-xl border p-2 transition-colors',
        isDragOver
          ? 'border-indigo-500 bg-indigo-950/30'
          : 'border-zinc-800 bg-zinc-900/40',
      ].join(' ')}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <span className="hidden lg:inline">{DAY_LABELS[day]}</span>
          <span className="lg:hidden">{DAY_SHORT[day]}</span>
        </span>
        <button
          onClick={() => onAddClick(day)}
          className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors text-sm leading-none"
          title={`Add session to ${DAY_LABELS[day]}`}
        >
          +
        </button>
      </div>

      {/* Sessions */}
      <div className="flex flex-col gap-1.5">
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            day={day}
            onDragStart={onSessionDragStart}
            onClick={() => onSessionClick(session, day)}
          />
        ))}
      </div>

      {/* Drop hint */}
      {isDragOver && sessions.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-indigo-600 py-4">
          <span className="text-xs text-indigo-400">Drop here</span>
        </div>
      )}
    </div>
  );
}

// ─── Session detail modal ─────────────────────────────────────────────────────

function SessionDetailModal({
  session,
  day,
  onDelete,
  onClose,
}: {
  session: TrainingSession;
  day: DayOfWeek;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { badge, dot } = SESSION_COLORS[session.type];

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{session.name}</h2>
          <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {SESSION_LABELS[session.type]}
          </span>
        </div>
        <span className="shrink-0 text-sm text-zinc-500">{DAY_LABELS[day]}</span>
      </div>

      <div className="mb-5 space-y-3">
        {/* Step list */}
        {session.steps.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Steps</p>
            <ol className="space-y-1">
              {session.steps.map(entry => {
                if (isRepeatBlock(entry)) {
                  return (
                    <li key={entry.id} className="space-y-0.5">
                      <span className="text-xs font-semibold text-zinc-400">{entry.reps}× repeat</span>
                      <ol className="ml-4 space-y-0.5">
                        {entry.steps.map(s => (
                          <li key={s.id} className="text-xs text-zinc-300">
                            {s.label} — {formatStepDuration(s)}
                            {s.target?.kind === 'effort' && <span className="ml-1 text-zinc-500">Zone {s.target.zone}</span>}
                            {s.target?.kind === 'pace'   && <span className="ml-1 text-zinc-500">{formatPace(s.target.minSecPerKm)}–{formatPace(s.target.maxSecPerKm)}</span>}
                          </li>
                        ))}
                      </ol>
                    </li>
                  );
                }
                return (
                  <li key={entry.id} className="text-xs text-zinc-300">
                    {entry.label} — {formatStepDuration(entry)}
                    {entry.target?.kind === 'effort' && <span className="ml-1 text-zinc-500">Zone {entry.target.zone}</span>}
                    {entry.target?.kind === 'pace'   && <span className="ml-1 text-zinc-500">{formatPace(entry.target.minSecPerKm)}–{formatPace(entry.target.maxSecPerKm)}</span>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {/* Stats */}
        {(() => {
          const km = computeTotalDistanceKm(session.steps);
          return km > 0 ? (
            <p className="text-xs text-zinc-500">{km} km total</p>
          ) : null;
        })()}
        {session.notes && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{session.notes}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="flex-1 rounded-lg border border-red-800 py-2 text-sm text-red-400 hover:bg-red-950/40 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-lg bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrainingCalendar() {
  const { plan, customPresets, addSession, removeSession, moveSession, saveCustomPreset } = useTrainingCalendar();

  // Drag state in a ref — no re-render needed while dragging
  const dragRef = useRef<{ sessionId: string; fromDay: DayOfWeek } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);

  // Modal state
  const [addDay, setAddDay] = useState<DayOfWeek | null>(null);
  const [detail, setDetail] = useState<{ session: TrainingSession; day: DayOfWeek } | null>(null);

  // Filter state — all visible by default
  const [visibleTypes, setVisibleTypes] = useState<Set<SessionType>>(new Set(SESSION_TYPES));

  function toggleType(type: SessionType) {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function handleDragStart(sessionId: string, fromDay: DayOfWeek) {
    dragRef.current = { sessionId, fromDay };
  }

  function handleDrop(toDay: DayOfWeek) {
    if (!dragRef.current) return;
    const { sessionId, fromDay } = dragRef.current;
    moveSession(fromDay, toDay, sessionId);
    dragRef.current = null;
    setDragOverDay(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Training Calendar</h1>
          <p className="mt-1 text-sm text-zinc-400">Drag sessions between days to reschedule.</p>
        </div>

        {/* Filter bar */}
        <FilterBar visible={visibleTypes} onToggle={toggleType} />

        {/* 7-day grid */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-2">
            {(Array.from({ length: 7 }, (_, i) => i) as DayOfWeek[]).map(day => (
              <DayColumn
                key={day}
                day={day}
                sessions={plan.days[day].filter(s => visibleTypes.has(s.type))}
                isDragOver={dragOverDay === day}
                onDragOver={d => setDragOverDay(d)}
                onDragLeave={() => setDragOverDay(null)}
                onDrop={handleDrop}
                onAddClick={d => setAddDay(d)}
                onSessionDragStart={handleDragStart}
                onSessionClick={(session, d) => setDetail({ session, day: d })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {addDay !== null && (
        <SessionBuilderModal
          day={addDay}
          customPresets={customPresets}
          onAdd={session => addSession(addDay, session)}
          onSavePreset={saveCustomPreset}
          onClose={() => setAddDay(null)}
        />
      )}
      {detail !== null && (
        <SessionDetailModal
          session={detail.session}
          day={detail.day}
          onDelete={() => removeSession(detail.day, detail.session.id)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

export default TrainingCalendar;
