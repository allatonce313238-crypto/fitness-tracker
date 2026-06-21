import { useState } from 'react'
import { useWorkoutStore } from './hooks/useWorkoutStore'
import { Header } from './components/Header'
import { Calendar } from './components/Calendar'
import { StatsPanel } from './components/StatsPanel'
import { WorkoutDetail } from './components/WorkoutDetail'
import type { MergedDay } from './types'

export default function App() {
  const { days, loading, dbError, clearDbError, updateDay, uploadImage, rescheduleDay, swapDays } = useWorkoutStore()
  const [selectedDay, setSelectedDay] = useState<MergedDay | null>(null)

  const liveSelected = selectedDay
    ? (days.find((d) => d.dayNumber === selectedDay.dayNumber) ?? null)
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }}
          />
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading from Supabase…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header days={days} />

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <section>
          <Calendar
            days={days}
            onDayClick={(day) => setSelectedDay(day)}
            onReschedule={rescheduleDay}
            onSwap={swapDays}
          />
        </section>

        <aside className="hidden lg:block">
          <StatsPanel days={days} />
        </aside>

        <div className="lg:hidden">
          <StatsPanel days={days} />
        </div>
      </main>

      {/* Supabase error banner */}
      {dbError && (
        <div
          className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50 flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-mono"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5' }}
        >
          <span className="flex-1 break-all">⚠️ {dbError}</span>
          <button onClick={clearDbError} className="flex-shrink-0 font-bold text-base leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {liveSelected && (
        <WorkoutDetail
          day={liveSelected}
          allDays={days}
          onClose={() => setSelectedDay(null)}
          onUpdateDay={updateDay as (dayNumber: number, patch: Record<string, unknown>) => Promise<void>}
          onUploadImage={uploadImage}
          onReschedule={rescheduleDay}
        />
      )}
    </div>
  )
}
