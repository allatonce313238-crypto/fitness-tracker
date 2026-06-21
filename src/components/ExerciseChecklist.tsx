import { CheckSquare, Square } from 'lucide-react'
import type { Exercise } from '../types'

interface Props {
  exercises: Exercise[]
  checked: string[]
  onToggle: (id: string) => void
}

function label(e: Exercise): string {
  const parts: string[] = [e.name]
  if (e.sets && e.reps) parts.push(`${e.sets}×${e.reps}`)
  else if (e.sets && e.duration) parts.push(`${e.sets}×${e.duration}`)
  else if (e.duration) parts.push(e.duration)
  return parts.join(' — ')
}

export function ExerciseChecklist({ exercises, checked, onToggle }: Props) {
  if (exercises.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
        No exercises scheduled — enjoy your rest!
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {exercises.map((ex) => {
        const done = checked.includes(ex.id)
        return (
          <li key={ex.id}>
            <button
              onClick={() => onToggle(ex.id)}
              className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 transition-colors"
              style={{
                background: done ? 'rgba(79,209,165,0.08)' : 'var(--bg-surface2)',
                border: `1px solid ${done ? 'rgba(79,209,165,0.3)' : 'var(--border)'}`,
              }}
            >
              {done ? (
                <CheckSquare size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              ) : (
                <Square size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              )}
              <span
                className="text-sm font-mono"
                style={{
                  color: done ? 'var(--accent-green)' : 'var(--text-primary)',
                  textDecoration: done ? 'line-through' : 'none',
                }}
              >
                {label(ex)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
