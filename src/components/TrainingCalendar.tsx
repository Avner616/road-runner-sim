// Road Runner Sim — TrainingCalendar.tsx
// Training calendar screen. Consumes useTrainingCalendar hook only — no engine imports.

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTrainingCalendar } from '../hooks/useTrainingCalendar';
import type { TrainingSession, SessionType, DayOfWeek } from '../engine/types/training';
import {
  SESSION_TYPES,
  SESSION_LABELS,
  DAY_LABELS,
  DAY_SHORT,
} from '../engine/types/training';

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
      {(session.distance != null || session.duration != null) && (
        <div className="mt-1 flex gap-2 pl-3.5 text-xs text-zinc-400">
          {session.distance != null && <span>{session.distance} km</span>}
          {session.duration != null && <span>{session.duration} min</span>}
        </div>
      )}
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

// ─── Add session modal ────────────────────────────────────────────────────────

function AddSessionModal({
  day,
  onAdd,
  onClose,
}: {
  day: DayOfWeek;
  onAdd: (params: { type: SessionType; name?: string; distance?: number; duration?: number; notes?: string }) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<SessionType>('easy-run');
  const [name, setName] = useState(SESSION_LABELS['easy-run']);
  const [nameEdited, setNameEdited] = useState(false);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  function handleTypeChange(next: SessionType) {
    setType(next);
    if (!nameEdited) setName(SESSION_LABELS[next]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onAdd({
      type,
      name:     name || undefined,
      distance: distance ? Number(distance) : undefined,
      duration: duration ? Number(duration) : undefined,
      notes:    notes || undefined,
    });
    onClose();
  }

  const { dot } = SESSION_COLORS[type];

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-5 text-lg font-bold text-white">
        Add session — {DAY_LABELS[day]}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Type</span>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${dot}`} />
            <select
              value={type}
              onChange={e => handleTypeChange(e.target.value as SessionType)}
              className="w-full appearance-none rounded-lg bg-gray-800 py-2 pl-8 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SESSION_TYPES.map(t => (
                <option key={t} value={t}>{SESSION_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </label>

        {/* Name */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Name</span>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setNameEdited(true); }}
            placeholder={SESSION_LABELS[type]}
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {/* Distance + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Distance (km)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder="—"
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Duration (min)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="—"
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </div>

        {/* Notes */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Notes</span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes…"
            rows={2}
            className="resize-none rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
          >
            Add session
          </button>
        </div>
      </form>
    </Modal>
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
        {(session.distance != null || session.duration != null) && (
          <div className="flex gap-6">
            {session.distance != null && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Distance</p>
                <p className="text-sm font-semibold text-white">{session.distance} km</p>
              </div>
            )}
            {session.duration != null && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-white">{session.duration} min</p>
              </div>
            )}
          </div>
        )}
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
  const { plan, addSession, removeSession, moveSession } = useTrainingCalendar();

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
        <AddSessionModal
          day={addDay}
          onAdd={params => addSession(addDay, params)}
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
