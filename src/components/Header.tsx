import type { MergedDay } from '../types'

interface Props {
  days: MergedDay[]
  onReset: () => void
}

function computeStats(days: MergedDay[]) {
  const trainingDays = days.filter((d) => d.workoutType !== 'rest')
  const completed = trainingDays.filter((d) => d.status === 'completed')

  const pct = trainingDays.length > 0 ? Math.round((completed.length / trainingDays.length) * 100) : 0

  // Streak: consecutive completed days up to today
  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...days].sort((a, b) => a.currentDate.localeCompare(b.currentDate))
  let streak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i]
    if (d.currentDate > today) continue
    if (d.workoutType === 'rest') continue
    if (d.status === 'completed') {
      streak++
    } else {
      break
    }
  }

  return { total: trainingDays.length, completed: completed.length, pct, streak }
}

export function Header({ days, onReset }: Props) {
  const { total, completed, pct, streak } = computeStats(days)

  return (
    <header
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-40 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              July 2026
            </h1>
            <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              30-Day Fitness Tracker
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <Chip label="Completed" value={`${completed}/${total}`} color="var(--accent-green)" />
            <Chip label="Streak" value={`${streak}d`} color="var(--accent-orange)" />
            <Chip label="Progress" value={`${pct}%`} color="var(--accent-blue)" />
            <button
              onClick={() => {
                if (window.confirm('Reset everything to the original plan? All swaps, completions, and notes will be cleared.')) {
                  onReset()
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}
            >
              Reset All
            </button>
            {/* Static weight goal */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}
            >
              <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent-purple)' }}>
                🎯 88 kg → 85.2 kg
              </span>
              <span
                className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(167,139,250,0.2)', color: 'var(--accent-purple)' }}
              >
                −2.8 kg
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'var(--accent-green)' }}
          />
        </div>
      </div>
    </header>
  )
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center px-3 py-1.5 rounded-lg text-center"
      style={{ background: 'var(--bg-surface2)' }}
    >
      <span className="font-mono font-semibold text-base" style={{ color }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}
