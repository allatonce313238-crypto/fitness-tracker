import { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, ArrowLeftRight } from 'lucide-react'
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
  isDragging: boolean      // this card is being dragged
  isSwapSource: boolean    // this card is selected as swap source
  isSwapMode: boolean      // any card is in swap-select mode
  onClick: () => void
  onSwapSelect: () => void // click the swap button
  onSwap: (srcDayNumber: number, targetDayNumber: number) => void
}

export function DayCard({
  day,
  isDragging,
  isSwapSource,
  isSwapMode,
  onClick,
  onSwapSelect,
  onSwap,
}: Props) {
  const [isOver, setIsOver] = useState(false)
  const [showSwapBtn, setShowSwapBtn] = useState(false)

  const color = TYPE_COLORS[day.workoutType]
  const dayOfMonth = parseInt(day.currentDate.split('-')[2] ?? '0', 10)

  const borderColor = isSwapSource
    ? 'var(--accent-blue)'
    : isOver
    ? color
    : isSwapMode
    ? 'rgba(91,143,255,0.4)' // dim highlight — potential swap target
    : 'transparent'

  const bgColor = isSwapSource
    ? 'rgba(91,143,255,0.12)'
    : isOver && isSwapMode
    ? 'rgba(91,143,255,0.12)'
    : isOver
    ? `${color}22`
    : TYPE_BG[day.workoutType]

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(day.dayNumber))
      }}
      onDragEnd={() => setIsOver(false)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsOver(true) }}
      onDragEnter={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const srcNum = parseInt(e.dataTransfer.getData('text/plain'), 10)
        if (!isNaN(srcNum) && srcNum !== day.dayNumber) {
          onSwap(srcNum, day.dayNumber)
        }
      }}
      onClick={() => {
        if (isSwapMode && !isSwapSource) {
          // User clicked a target card while in swap mode — execute swap via parent
          onClick()
        } else {
          onClick()
        }
      }}
      onMouseEnter={() => setShowSwapBtn(true)}
      onMouseLeave={() => setShowSwapBtn(false)}
      className="relative rounded-xl p-3 flex flex-col gap-1 select-none min-h-[88px]"
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        outline: borderColor === 'transparent' ? `1px solid var(--border)` : 'none',
        opacity: isDragging ? 0.35 : 1,
        cursor: isSwapMode ? 'pointer' : 'grab',
        transition: 'border-color 0.1s, background 0.1s',
      }}
    >
      {/* Swap button (hover) */}
      {(showSwapBtn || isSwapSource) && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwapSelect() }}
          title={isSwapSource ? 'Cancel swap' : 'Swap this day'}
          className="absolute top-1.5 right-1.5 rounded-md p-0.5 transition-opacity hover:opacity-80"
          style={{
            background: isSwapSource ? 'var(--accent-blue)' : 'var(--bg-surface2)',
            color: isSwapSource ? '#fff' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          <ArrowLeftRight size={11} />
        </button>
      )}

      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        {dayOfMonth}
      </span>

      <div className="flex items-center gap-1.5 pr-5">
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

      {/* "Swap source" label */}
      {isSwapSource && (
        <div
          className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-xs rounded font-semibold py-0.5"
          style={{ background: 'var(--accent-blue)', color: '#fff', fontSize: '0.6rem' }}
        >
          SELECT TARGET
        </div>
      )}
    </div>
  )
}
