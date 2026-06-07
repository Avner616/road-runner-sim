// Road Runner Sim — SessionLibrary
// Pure TypeScript. Zero UI imports. Static preset library + query functions.

import type { SessionPreset, SessionStep, RepeatBlock, SessionEntry, SessionType, StepTarget } from './types/training';

// ─── Construction helpers (unexported) ────────────────────────────────────────

type StepDef = Omit<SessionStep, 'id'>;
type BlockDef = { kind: 'repeat'; reps: number; steps: StepDef[] };
type EntryDef = StepDef | BlockDef;

function effort(zone: 1 | 2 | 3 | 4 | 5): StepTarget { return { kind: 'effort', zone }; }
function pace(min: number, max: number): StepTarget { return { kind: 'pace', minSecPerKm: min, maxSecPerKm: max }; }

function makePreset(
  id: string,
  type: SessionType,
  name: string,
  description: string,
  entries: EntryDef[],
): SessionPreset {
  const steps: SessionEntry[] = entries.map((e, ei) => {
    if ('kind' in e) {
      const block: RepeatBlock = {
        id: `${id}-b${ei}`,
        kind: 'repeat',
        reps: e.reps,
        steps: e.steps.map((s, si): SessionStep => ({ id: `${id}-b${ei}-s${si}`, ...s })),
      };
      return block;
    }
    const step: SessionStep = { id: `${id}-s${ei}`, ...e };
    return step;
  });
  return { id, type, name, description, steps };
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS: SessionPreset[] = [

  // ── Easy Run ──────────────────────────────────────────────────────────────

  makePreset('er-recovery-jog', 'easy-run', 'Recovery Jog',
    'Gentle aerobic work to flush out fatigue. Keep effort in Zone 1 throughout.',
    [
      { label: 'Easy', durationType: 'time', durationValue: 30, target: effort(1) },
    ],
  ),

  makePreset('er-morning-5k', 'easy-run', 'Morning Easy 5K',
    'A comfortable 5 km to build your aerobic base. Conversational pace throughout.',
    [
      { label: 'Easy', durationType: 'distance', durationValue: 5, target: effort(2) },
    ],
  ),

  makePreset('er-foundation-10k', 'easy-run', 'Foundation Run',
    'Steady aerobic foundation. The bread-and-butter run of any training block.',
    [
      { label: 'Easy', durationType: 'distance', durationValue: 10, target: effort(2) },
    ],
  ),

  makePreset('er-easy-hour', 'easy-run', 'Easy Hour',
    '60 minutes of easy running. Time on feet, low stress, high aerobic return.',
    [
      { label: 'Easy', durationType: 'time', durationValue: 60, target: effort(2) },
    ],
  ),

  // ── Long Run ──────────────────────────────────────────────────────────────

  makePreset('lr-weekend-long', 'long-run', 'Weekend Long Run',
    'Classic long run structure. Easy throughout, building your weekly mileage safely.',
    [
      { label: 'Warm Up', durationType: 'distance', durationValue: 3,  target: effort(2) },
      { label: 'Easy',    durationType: 'distance', durationValue: 14, target: effort(2) },
      { label: 'Cool Down', durationType: 'distance', durationValue: 3, target: effort(1) },
    ],
  ),

  makePreset('lr-progressive', 'long-run', 'Progressive Long Run',
    'Start easy and build to marathon pace in the final third. Teaches controlled fatigue running.',
    [
      { label: 'Easy',         durationType: 'distance', durationValue: 8, target: effort(2) },
      { label: 'Marathon Pace', durationType: 'distance', durationValue: 8, target: pace(285, 315) },
      { label: 'Cool Down',    durationType: 'distance', durationValue: 2, target: effort(1) },
    ],
  ),

  makePreset('lr-surges', 'long-run', 'Long Run with Surges',
    'Easy long run with brief acceleration bursts to improve running economy without heavy fatigue.',
    [
      { label: 'Easy', durationType: 'distance', durationValue: 5, target: effort(2) },
      { kind: 'repeat', reps: 8, steps: [
        { label: 'Surge', durationType: 'time', durationValue: 1,  target: effort(4) },
        { label: 'Easy',  durationType: 'time', durationValue: 4,  target: effort(2) },
      ]},
      { label: 'Easy', durationType: 'distance', durationValue: 5, target: effort(2) },
    ],
  ),

  makePreset('lr-back-to-back', 'long-run', 'Back-to-Back Long',
    'High-mileage effort. Best run the day after a medium session to simulate late-race fatigue.',
    [
      { label: 'Easy', durationType: 'distance', durationValue: 22, target: effort(2) },
    ],
  ),

  // ── Intervals ─────────────────────────────────────────────────────────────

  makePreset('in-classic-km', 'intervals', 'Classic Kilometer',
    'The staple interval workout. Builds VO₂ max and running economy at 5K race pace.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2,   target: effort(2) },
      { kind: 'repeat', reps: 6, steps: [
        { label: 'Work',     durationType: 'distance', durationValue: 1,   target: pace(225, 240) },
        { label: 'Recovery', durationType: 'distance', durationValue: 0.4, target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 1,   target: effort(1) },
    ],
  ),

  makePreset('in-track-400s', 'intervals', 'Track 400s',
    'Short, sharp efforts around the track. Develops raw speed and neuromuscular turnover.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2,   target: effort(2) },
      { kind: 'repeat', reps: 10, steps: [
        { label: 'Work',     durationType: 'distance', durationValue: 0.4, target: pace(210, 225) },
        { label: 'Recovery', durationType: 'time',     durationValue: 1.5, target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 2,   target: effort(1) },
    ],
  ),

  makePreset('in-vo2-1200s', 'intervals', 'VO₂ Max 1200s',
    'Sustained high-intensity efforts to maximize aerobic power. Demanding — allow 48 h recovery.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2,   target: effort(2) },
      { kind: 'repeat', reps: 5, steps: [
        { label: 'Work',     durationType: 'distance', durationValue: 1.2, target: pace(220, 235) },
        { label: 'Recovery', durationType: 'distance', durationValue: 0.4, target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 1,   target: effort(1) },
    ],
  ),

  makePreset('in-track-800s', 'intervals', 'Track 800s',
    'Middle-distance interval session. Bridges speed and endurance. Strong at 3 km–5 km race pace.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2,   target: effort(2) },
      { kind: 'repeat', reps: 8, steps: [
        { label: 'Work',     durationType: 'distance', durationValue: 0.8, target: pace(215, 230) },
        { label: 'Recovery', durationType: 'time',     durationValue: 2,   target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 2,   target: effort(1) },
    ],
  ),

  // ── Tempo ─────────────────────────────────────────────────────────────────

  makePreset('te-threshold', 'tempo', 'Threshold Run',
    'Classic lactate-threshold session. Comfortably hard — you could speak, but choose not to.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2, target: effort(2) },
      { label: 'Tempo',     durationType: 'distance', durationValue: 6, target: pace(270, 300) },
      { label: 'Cool Down', durationType: 'distance', durationValue: 2, target: effort(1) },
    ],
  ),

  makePreset('te-cruise-intervals', 'tempo', 'Cruise Intervals',
    'Broken threshold work with short recovery. Higher total tempo volume with less fatigue than a continuous run.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2, target: effort(2) },
      { kind: 'repeat', reps: 3, steps: [
        { label: 'Tempo',    durationType: 'distance', durationValue: 2, target: pace(270, 295) },
        { label: 'Recovery', durationType: 'time',     durationValue: 2, target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 2, target: effort(1) },
    ],
  ),

  makePreset('te-progression', 'tempo', 'Progression Run',
    'Three-phase run building from easy to race pace. Teaches pacing discipline and late-run speed.',
    [
      { label: 'Easy',      durationType: 'distance', durationValue: 5, target: effort(2) },
      { label: 'Tempo',     durationType: 'distance', durationValue: 5, target: pace(285, 305) },
      { label: 'Race Pace', durationType: 'distance', durationValue: 3, target: pace(255, 275) },
      { label: 'Cool Down', durationType: 'distance', durationValue: 1, target: effort(1) },
    ],
  ),

  makePreset('te-race-pace-long', 'tempo', 'Race Pace Long',
    'Extended run at goal race pace. A race-specific fitness test — run this only when fit.',
    [
      { label: 'Warm Up',    durationType: 'distance', durationValue: 2,  target: effort(2) },
      { label: 'Race Pace',  durationType: 'distance', durationValue: 10, target: pace(255, 275) },
      { label: 'Cool Down',  durationType: 'distance', durationValue: 2,  target: effort(1) },
    ],
  ),

  // ── Hill Work ─────────────────────────────────────────────────────────────

  makePreset('hw-short-repeats', 'hill-work', 'Short Hill Repeats',
    'Explosive uphill bursts followed by easy walk-down recovery. Builds power and running form.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2,   target: effort(2) },
      { kind: 'repeat', reps: 10, steps: [
        { label: 'Hill',     durationType: 'time',     durationValue: 1.5, target: effort(5) },
        { label: 'Walk',     durationType: 'time',     durationValue: 2,   target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 2,   target: effort(1) },
    ],
  ),

  makePreset('hw-long-repeats', 'hill-work', 'Long Hill Repeats',
    'Sustained uphill efforts that simulate race-day climbing. Builds strength-endurance.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2, target: effort(2) },
      { kind: 'repeat', reps: 5, steps: [
        { label: 'Hill',     durationType: 'time',     durationValue: 3, target: effort(4) },
        { label: 'Recovery', durationType: 'time',     durationValue: 2, target: effort(1) },
      ]},
      { label: 'Cool Down', durationType: 'distance', durationValue: 2, target: effort(1) },
    ],
  ),

  makePreset('hw-rolling', 'hill-work', 'Rolling Hill Run',
    'Continuous run over hilly terrain. Develops hill-specific leg strength without speed work.',
    [
      { label: 'Easy', durationType: 'distance', durationValue: 12, target: effort(3) },
    ],
  ),

  makePreset('hw-hill-tempo', 'hill-work', 'Hill Tempo',
    'Tempo effort on an uphill course. Delivers threshold-equivalent aerobic stress at lower joint impact.',
    [
      { label: 'Warm Up',   durationType: 'distance', durationValue: 2, target: effort(2) },
      { label: 'Hill',      durationType: 'distance', durationValue: 5, target: effort(4) },
      { label: 'Cool Down', durationType: 'distance', durationValue: 2, target: effort(1) },
    ],
  ),

  // ── Resistance Training ───────────────────────────────────────────────────

  makePreset('rt-runner-strength', 'resistance-training', 'Runner Strength',
    'Full lower-body circuit targeting the hip chain. Reduces injury risk and improves running economy.',
    [
      { label: 'Warm Up',    durationType: 'time', durationValue: 10 },
      { kind: 'repeat', reps: 3, steps: [
        { label: 'Squats',     durationType: 'time', durationValue: 1 },
        { label: 'Lunges',     durationType: 'time', durationValue: 1 },
        { label: 'Hip Thrusts',durationType: 'time', durationValue: 1 },
        { label: 'Rest',       durationType: 'time', durationValue: 1.5 },
      ]},
      { label: 'Stretching', durationType: 'time', durationValue: 10 },
    ],
  ),

  makePreset('rt-core-circuit', 'resistance-training', 'Core Circuit',
    'Running-specific core work to stabilise the pelvis and improve force transfer.',
    [
      { label: 'Warm Up', durationType: 'time', durationValue: 5 },
      { kind: 'repeat', reps: 3, steps: [
        { label: 'Plank',          durationType: 'time', durationValue: 1 },
        { label: 'Core',           durationType: 'time', durationValue: 1 },
        { label: 'Hip Thrusts',    durationType: 'time', durationValue: 1 },
        { label: 'Rest',           durationType: 'time', durationValue: 1 },
      ]},
      { label: 'Stretching', durationType: 'time', durationValue: 10 },
    ],
  ),

  makePreset('rt-lower-body-power', 'resistance-training', 'Lower Body Power',
    'Explosive plyometric session. Builds reactive strength and fast-twitch recruitment.',
    [
      { label: 'Warm Up',    durationType: 'time', durationValue: 10 },
      { kind: 'repeat', reps: 4, steps: [
        { label: 'Squats',   durationType: 'time', durationValue: 1 },
        { label: 'Lunges',   durationType: 'time', durationValue: 1 },
        { label: 'Rest',     durationType: 'time', durationValue: 1.5 },
      ]},
      { label: 'Stretching', durationType: 'time', durationValue: 10 },
    ],
  ),

  // ── Rest ──────────────────────────────────────────────────────────────────

  makePreset('rs-full-rest', 'rest', 'Full Rest Day',
    'Complete rest. No structured activity. Sleep, nutrition, and stress management are the work today.',
    [
      { label: 'Rest', durationType: 'time', durationValue: 0 },
    ],
  ),

  makePreset('rs-active-recovery', 'rest', 'Active Recovery',
    'Light movement to stimulate blood flow without adding training stress. Walk, stretch, or swim.',
    [
      { label: 'Walk',       durationType: 'time', durationValue: 30, target: effort(1) },
      { label: 'Stretching', durationType: 'time', durationValue: 15 },
    ],
  ),

  makePreset('rs-mobility', 'rest', 'Mobility Session',
    'Targeted range-of-motion work for hips, ankles, and thoracic spine. Reduces injury risk over time.',
    [
      { label: 'Stretching', durationType: 'time', durationValue: 45 },
    ],
  ),

];

// ─── Query functions ──────────────────────────────────────────────────────────

export function getAllPresets(): SessionPreset[] {
  return PRESETS;
}

export function getPresetsByType(type: SessionType): SessionPreset[] {
  return PRESETS.filter(p => p.type === type);
}

export function getPresetById(id: string): SessionPreset | undefined {
  return PRESETS.find(p => p.id === id);
}
