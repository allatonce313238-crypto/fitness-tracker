import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
    const overData = e.over.data.current as { date: string; dayNumber?: number }
    const targetDate = overData.date
    const targetDayNum = overData.dayNumber

    const srcDay = dayMap.get(srcDayNum)
    if (!srcDay || srcDay.currentDate === targetDate) return

    if (targetDayNum !== undefined && targetDayNum !== srcDayNum) {
      // Swap two workout days
      await onSwap(srcDayNum, targetDayNum)
    } else if (targetDayNum === undefined) {
      // Move to an empty slot
      await onReschedule(srcDayNum, targetDate)
    }
  }

  const draggingDay = draggingId !== null ? dayMap.get(draggingId) : undefined

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
          {Array.from({ length: FIRST_DAY_OFFSET }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}
          {allJulyDates.map((date) => {
            const day = dateMap.get(date)
            return (
              <DroppableCell key={date} date={date} dayNumber={day?.dayNumber}>
                {day ? (
                  <DayCard day={day} onClick={() => onDayClick(day)} />
                ) : (
                  <EmptySlot date={date} />
                )}
              </DroppableCell>
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingDay && (
          <div
            className="rounded-xl p-3 shadow-2xl pointer-events-none"
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--accent-blue)',
              opacity: 0.95,
              minWidth: 100,
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

function DroppableCell({
  date,
  dayNumber,
  children,
}: {
  date: string
  dayNumber?: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${date}`,
    data: { date, dayNumber },
  })

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl transition-all duration-150"
      style={{
        outline: isOver ? '2px solid var(--accent-blue)' : '2px solid transparent',
        outlineOffset: '2px',
      }}
    >
      {children}
    </div>
  )
}

function EmptySlot({ date }: { date: string }) {
  const dayNum = parseInt(date.split('-')[2] ?? '0', 10)
  return (
    <div
      className="rounded-xl min-h-[88px] flex flex-col justify-start p-3"
      style={{ border: '1px dashed var(--border)' }}
    >
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        {dayNum}
      </span>
    </div>
  )
}
