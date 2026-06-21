import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  pointerWithin,
} from '@dnd-kit/core'
import { useState } from 'react'
import { DayCard } from './DayCard'
import type { MergedDay, RescheduleResult } from '../types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// July 1 2026 = Wednesday → offset 2 (Mon=0)
const FIRST_DAY_OFFSET = 2

interface Props {
  days: MergedDay[]
  onDayClick: (day: MergedDay) => void
  onReschedule: (dayNumber: number, newDate: string) => Promise<RescheduleResult>
  onSwap: (dayNumberA: number, dayNumberB: number) => Promise<void>
}

export function Calendar({ days, onDayClick, onReschedule, onSwap }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const dateMap = new Map(days.map((d) => [d.currentDate, d]))
  const dayMap = new Map(days.map((d) => [d.dayNumber, d]))

  const allJulyDates = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(2026, 6, i + 1)
    return d.toISOString().slice(0, 10)
  })

  function handleDragStart(e: DragStartEvent) {
    setDraggingId((e.active.data.current as { dayNumber: number }).dayNumber)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null)
    if (!e.over) return

    const srcDayNum = (e.active.data.current as { dayNumber: number }).dayNumber
    const overData = e.over.data.current as { dayNumber?: number; date?: string }

    // Dropped on another DayCard → swap
    if (overData.dayNumber !== undefined && overData.dayNumber !== srcDayNum) {
      await onSwap(srcDayNum, overData.dayNumber)
      return
    }

    // Dropped on an empty cell → reschedule
    if (overData.date !== undefined && overData.dayNumber === undefined) {
      const srcDay = dayMap.get(srcDayNum)
      if (srcDay && srcDay.currentDate !== overData.date) {
        await onReschedule(srcDayNum, overData.date)
      }
    }
  }

  const draggingDay = draggingId !== null ? dayMap.get(draggingId) : undefined

  return (
    // pointerWithin: collision fires when the cursor is physically inside the target rect
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-semibold uppercase tracking-wider py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: FIRST_DAY_OFFSET }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}

          {allJulyDates.map((date) => {
            const day = dateMap.get(date)
            return day ? (
              // Occupied cell: DayCard is both draggable + droppable
              <DayCard key={day.dayNumber} day={day} onClick={() => onDayClick(day)} />
            ) : (
              // Empty cell: just a droppable landing zone
              <EmptyCell key={date} date={date} />
            )
          })}
        </div>
      </div>

      {/* Ghost card that follows the cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {draggingDay && (
          <div
            className="rounded-xl p-3 shadow-2xl pointer-events-none"
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--accent-blue)',
              minWidth: 90,
              opacity: 0.95,
            }}
          >
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Day {draggingDay.dayNumber}
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {draggingDay.title}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Droppable landing zone for dates that currently have no workout assigned
function EmptyCell({ date }: { date: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${date}`,
    data: { date },
  })
  const dayNum = parseInt(date.split('-')[2] ?? '0', 10)

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl min-h-[88px] flex flex-col justify-start p-3 transition-colors"
      style={{
        border: `2px dashed ${isOver ? 'var(--accent-blue)' : 'var(--border)'}`,
        background: isOver ? 'rgba(91,143,255,0.08)' : 'transparent',
      }}
    >
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        {dayNum}
      </span>
    </div>
  )
}
