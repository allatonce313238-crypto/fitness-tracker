import type { MergedDay, WorkoutType } from '../types'

interface Props {
  days: MergedDay[]
}

const TYPE_LABELS: Record<WorkoutType, string> = {
  weights: 'Weights',
  hiit: 'HIIT',
  cardio: 'Cardio',
  active_recovery: 'Recovery',
  rest: 'Rest',
}

const TYPE_COLORS: Record<WorkoutType, string> = {
  weights: 'var(--accent-green)',
  hiit: 'var(--accent-orange)',
  cardio: 'var(--accent-blue)',
  active_recovery: 'var(--accent-purple)',
  rest: 'var(--accent-gray)',
}

function computeStreak(days: MergedDay[]): { current: number; longest: number } {
  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...days]
    .filter((d) => d.workoutType !== 'rest' && d.currentDate <= today)
    .sort((a, b) => a.currentDate.localeCompare(b.currentDate))

  let current = 0
  let longest = 0
  let run = 0

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === 'completed') {
      if (current === 0 || i === sorted.length - 1 - current) {
        current++
      }
    } else if (current === 0) {
      // Gap at the end — current streak is 0
      break
    } else {
      break
    }
  }

  run = 0
  for (const d of sorted) {
    if (d.status === 'completed') {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  return { current, longest }
}

export function StatsPanel({ days }: Props) {
  const trainingTypes: WorkoutType[] = ['weights', 'hiit', 'cardio', 'active_recovery']
  const { current, longest } = computeStreak(days)

  const totalTraining = days.filter((d) => d.workoutType !== 'rest').length
  const totalCompleted = days.filter((d) => d.status === 'completed').length

  return (
    <aside
      className="rounded-2xl p-5 flex flex-col gap-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
        Monthly Stats
      </h2>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Completed" value={`${totalCompleted}/${totalTraining}`} color="var(--accent-green)" />
        <StatCard label="Current Streak" value={`${current}d`} color="var(--accent-orange)" />
        <StatCard label="Longest Streak" value={`${longest}d`} color="var(--accent-blue)" />
        <StatCard
          label="Completion"
          value={totalTraining > 0 ? `${Math.round((totalCompleted / totalTraining) * 100)}%` : '0%'}
          color="var(--accent-purple)"
        />
      </div>

      {/* Per-type breakdown */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          By Type
        </p>
        {trainingTypes.map((type) => {
          const typeDays = days.filter((d) => d.workoutType === type)
          const typeCompleted = typeDays.filter((d) => d.status === 'completed').length
          const pct = typeDays.length > 0 ? Math.round((typeCompleted / typeDays.length) * 100) : 0
          const color = TYPE_COLORS[type]
          return (
            <div key={type} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-primary)' }}>{TYPE_LABELS[type]}</span>
                <span className="font-mono" style={{ color }}>
                  {typeCompleted}/{typeDays.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}
    >
      <span className="font-mono font-bold text-lg" style={{ color }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}
