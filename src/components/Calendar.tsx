import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { DayCard } from './DayCard'
import type { MergedDay, RescheduleResult } from '../types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// July 2026: 1st = Wednesday → offset = 2 (Mon=0)
const FIRST_DAY_OFFSET = 2

interface Props {
  days: MergedDay[]
  onDayClick: (day: MergedDay) => void
  onReschedule: (dayNumber: number, newDate: string) => Promise<RescheduleResult>
}

export function Calendar({ days, onDayClick, onReschedule }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // Build a map: date string → MergedDay (for drop targets)
  const dateMap = new Map(days.map((d) => [d.currentDate, d]))

  function handleDragStart(e: DragStartEvent) {
    const dn = (e.active.data.current as { dayNumber: number }).dayNumber
    setDraggingId(dn)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null)
    const srcDayNum = (e.active.data.current as { dayNumber: number }).dayNumber
    const over = e.over
    if (!over) return
    const targetDate = (over.data.current as { date: string }).date
    const srcDay = days.find((d) => d.dayNumber === srcDayNum)
    if (!srcDay || srcDay.currentDate === targetDate) return
    await onReschedule(srcDayNum, targetDate)
  }

  const draggingDay = draggingId !== null ? days.find((d) => d.dayNumber === draggingId) : null

  // Determine which dates are occupied so drop zones on empty cells know their date
  // Generate all 31 July dates for the grid
  const allJulyDates: string[] = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(2026, 6, i + 1)
    return d.toISOString().slice(0, 10)
  })

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
          {/* Offset empty cells */}
          {Array.from({ length: FIRST_DAY_OFFSET }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* One cell per calendar date */}
          {allJulyDates.map((date) => {
            const day = dateMap.get(date)
            if (!day) {
              // Empty cell (a day was moved away — show placeholder)
              return (
                <EmptyCell key={date} date={date} />
              )
            }
            return (
              <DayCard
                key={day.dayNumber}
                day={day}
                onClick={() => onDayClick(day)}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {draggingDay && (
          <div
            className="rounded-xl p-3 opacity-90 shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-blue)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {draggingDay.title}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

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
        background: isOver ? 'rgba(91,143,255,0.1)' : 'transparent',
        border: `1px dashed ${isOver ? 'var(--accent-blue)' : 'var(--border)'}`,
      }}
    >
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        {dayNum}
      </span>
    </div>
  )
}
