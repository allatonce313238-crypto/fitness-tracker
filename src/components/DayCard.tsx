import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
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
  // Draggable — the thing you pick up
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `drag-${day.dayNumber}`,
    data: { dayNumber: day.dayNumber, date: day.currentDate },
  })

  // Droppable — the landing zone for other cards
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${day.dayNumber}`,
    data: { dayNumber: day.dayNumber, date: day.currentDate },
  })

  const color = TYPE_COLORS[day.workoutType]
  const dayOfMonth = parseInt(day.currentDate.split('-')[2] ?? '0', 10)

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="relative rounded-xl p-3 flex flex-col gap-1 select-none min-h-[88px]"
      style={{
        background: isOver ? `${color}22` : TYPE_BG[day.workoutType],
        border: `2px solid ${isOver ? color : 'var(--border)'}`,
        opacity: isDragging ? 0.25 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        {dayOfMonth}
      </span>

      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span
          className="text-xs font-medium leading-tight line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {day.title}
        </span>
      </div>

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
