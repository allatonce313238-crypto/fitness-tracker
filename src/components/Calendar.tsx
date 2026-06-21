import { useState } from 'react'
import { DayCard } from './DayCard'
import type { MergedDay, RescheduleResult } from '../types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FIRST_DAY_OFFSET = 2 // July 1 2026 = Wednesday

interface Props {
  days: MergedDay[]
  onDayClick: (day: MergedDay) => void
  onReschedule: (dayNumber: number, newDate: string) => Promise<RescheduleResult>
  onSwap: (dayNumberA: number, dayNumberB: number) => Promise<void>
}

export function Calendar({ days, onDayClick, onReschedule, onSwap }: Props) {
  const [draggingNum, setDraggingNum] = useState<number | null>(null)

  const dateMap = new Map(days.map((d) => [d.currentDate, d]))

  const allJulyDates = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(2026, 6, i + 1)
    return d.toISOString().slice(0, 10)
  })

  function handleDrop(targetDayNum: number) {
    if (draggingNum === null || draggingNum === targetDayNum) {
      setDraggingNum(null)
      return
    }
    void onSwap(draggingNum, targetDayNum)
    setDraggingNum(null)
  }

  function handleDropOnEmpty(targetDate: string) {
    if (draggingNum === null) return
    const srcDay = days.find((d) => d.dayNumber === draggingNum)
    if (srcDay && srcDay.currentDate !== targetDate) {
      void onReschedule(draggingNum, targetDate)
    }
    setDraggingNum(null)
  }

  return (
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
            <DayCard
              key={day.dayNumber}
              day={day}
              isDragging={draggingNum === day.dayNumber}
              onClick={() => { if (draggingNum === null) onDayClick(day) }}
              onDragStart={setDraggingNum}
              onDrop={handleDrop}
            />
          ) : (
            <EmptyCell
              key={date}
              date={date}
              onDrop={handleDropOnEmpty}
            />
          )
        })}
      </div>
    </div>
  )
}

function EmptyCell({ date, onDrop }: { date: string; onDrop: (date: string) => void }) {
  const [isOver, setIsOver] = useState(false)
  const dayNum = parseInt(date.split('-')[2] ?? '0', 10)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragEnter={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(date) }}
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
