import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CheckCircle, XCircle, GripVertical, RefreshCw } from 'lucide-react'
import type { MergedDay, WorkoutType } from '../types'

const TYPE_COLORS: Record<WorkoutType, string> = {
  weights: 'var(--accent-green)',
  hiit: 'var(--accent-orange)',
  cardio: 'var(--accent-blue)',
  active_recovery: 'var(--accent-purple)',
  rest: 'var(--accent-gray)',
}

const TYPE_BG: Record<WorkoutType, string> = {
  weights: 'rgba(79,209,165,0.07)',
  hiit: 'rgba(245,166,35,0.07)',
  cardio: 'rgba(91,143,255,0.07)',
  active_recovery: 'rgba(167,139,250,0.07)',
  rest: 'rgba(55,65,81,0.2)',
}

interface Props {
  day: MergedDay
  onClick: () => void
}

export function DayCard({ day, onClick }: Props) {
  const draggableId = `day-${day.dayNumber}`
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: draggableId,
    data: { dayNumber: day.dayNumber },
    disabled: day.workoutType === 'rest',
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${day.dayNumber}`,
    data: { dayNumber: day.dayNumber, date: day.currentDate },
  })

  const color = TYPE_COLORS[day.workoutType]
  const bg = TYPE_BG[day.workoutType]

  // Day of month from currentDate
  const dayOfMonth = parseInt(day.currentDate.split('-')[2] ?? '0', 10)

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      onClick={onClick}
      className="relative rounded-xl p-3 cursor-pointer flex flex-col gap-1 select-none transition-all duration-200 min-h-[88px]"
      style={{
        background: isOver ? `rgba(${typeRgb(day.workoutType)},0.18)` : bg,
        border: `1px solid ${isOver ? color : 'var(--border)'}`,
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.97)' : undefined,
      }}
    >
      {/* Drag handle */}
      {day.workoutType !== 'rest' && (
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing"
          style={{ color: 'var(--text-muted)' }}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* Day number */}
      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        {dayOfMonth}
      </span>

      {/* Color dot + title */}
      <div className="flex items-center gap-1.5 pr-4">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span
          className="text-xs font-medium leading-tight line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {day.title}
        </span>
      </div>

      {/* Status + rescheduled tag */}
      <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
        {day.status === 'completed' && (
          <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
        )}
        {day.status === 'skipped' && (
          <XCircle size={14} style={{ color: 'var(--accent-orange)' }} />
        )}
        {day.isRescheduled && (
          <span
            className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-mono"
            style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' }}
          >
            <RefreshCw size={10} />
            moved
          </span>
        )}
      </div>
    </div>
  )
}

function typeRgb(type: WorkoutType): string {
  switch (type) {
    case 'weights': return '79,209,165'
    case 'hiit': return '245,166,35'
    case 'cardio': return '91,143,255'
    case 'active_recovery': return '167,139,250'
    case 'rest': return '55,65,81'
  }
}
