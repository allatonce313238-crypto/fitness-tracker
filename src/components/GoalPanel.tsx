import { Target } from 'lucide-react'
import { useGoals, GOAL_MONTHS } from '../hooks/useGoals'

export function GoalPanel() {
  const { goals, setGoal } = useGoals()

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <Target size={16} style={{ color: 'var(--accent-orange)' }} />
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Goals
        </h2>
      </div>

      {GOAL_MONTHS.map(({ key, label }) => {
        const g = goals[key] ?? { targetWeight: null, targetFatPct: null }
        return (
          <div key={key} className="flex flex-col gap-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </p>

            <GoalInput
              label="Target Weight"
              unit="kg"
              value={g.targetWeight}
              color="var(--accent-green)"
              onChange={(v) => setGoal(key, 'targetWeight', v)}
            />
            <GoalInput
              label="Target Body Fat"
              unit="%"
              value={g.targetFatPct}
              color="var(--accent-blue)"
              onChange={(v) => setGoal(key, 'targetFatPct', v)}
            />
          </div>
        )
      })}
    </div>
  )
}

function GoalInput({
  label,
  unit,
  value,
  color,
  onChange,
}: {
  label: string
  unit: string
  value: number | null
  color: string
  onChange: (v: number | null) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
      style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}
    >
      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.1"
          min="0"
          value={value ?? ''}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            onChange(isNaN(n) ? null : n)
          }}
          placeholder="—"
          className="w-16 rounded-lg px-2 py-1 text-xs font-mono text-right outline-none"
          style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            color,
          }}
          onFocus={(e) => (e.target.style.borderColor = color)}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        <span className="text-xs w-4" style={{ color: 'var(--text-muted)' }}>
          {unit}
        </span>
      </div>
    </div>
  )
}
