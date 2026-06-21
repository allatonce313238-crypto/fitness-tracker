import { useState } from 'react'
import { X } from 'lucide-react'
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
  // Drag state — just for fading the source card
  const [draggingNum, setDraggingNum] = useState<number | null>(null)

  // Swap-mode state — click 🔄 on one card, then click another to swap
  const [swapSourceNum, setSwapSourceNum] = useState<number | null>(null)

  const dateMap = new Map(days.map((d) => [d.currentDate, d]))

  const allJulyDates = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(2026, 6, i + 1)
    return d.toISOString().slice(0, 10)
  })

  // Called from the DayCard's onDrop handler with BOTH numbers (read from dataTransfer)
  function handleSwap(srcNum: number, targetNum: number) {
    setDraggingNum(null)
    void onSwap(srcNum, targetNum)
  }

  // Swap-mode: select or execute
  function handleSwapSelect(dayNumber: number) {
    if (swapSourceNum === null) {
      // First click — set this as source
      setSwapSourceNum(dayNumber)
    } else if (swapSourceNum === dayNumber) {
      // Clicked same card — cancel
      setSwapSourceNum(null)
    } else {
      // Second click — execute swap
      void onSwap(swapSourceNum, dayNumber)
      setSwapSourceNum(null)
    }
  }

  // Clicking any card while in swap mode acts as "select target"
  function handleCardClick(day: MergedDay) {
    if (swapSourceNum !== null && swapSourceNum !== day.dayNumber) {
      void onSwap(swapSourceNum, day.dayNumber)
      setSwapSourceNum(null)
    } else {
      onDayClick(day)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Swap-mode banner */}
      {swapSourceNum !== null && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(91,143,255,0.12)', border: '1px solid rgba(91,143,255,0.35)', color: 'var(--accent-blue)' }}
        >
          <span>
            🔄 Day {swapSourceNum} selected — click any other day to swap
          </span>
          <button
            onClick={() => setSwapSourceNum(null)}
            className="hover:opacity-70 flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
              isSwapSource={swapSourceNum === day.dayNumber}
              isSwapMode={swapSourceNum !== null}
              onClick={() => handleCardClick(day)}
              onSwapSelect={() => handleSwapSelect(day.dayNumber)}
              onSwap={handleSwap}
            />
          ) : (
            <EmptyCell key={date} date={date} onDrop={(src) => { void onReschedule(src, date); setDraggingNum(null) }} />
          )
        })}
      </div>
    </div>
  )
}

function EmptyCell({ date, onDrop }: { date: string; onDrop: (srcDayNumber: number) => void }) {
  const [isOver, setIsOver] = useState(false)
  const dayNum = parseInt(date.split('-')[2] ?? '0', 10)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragEnter={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const src = parseInt(e.dataTransfer.getData('text/plain'), 10)
        if (!isNaN(src)) onDrop(src)
      }}
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
