import { useState } from 'react'
import { useWorkoutStore } from './hooks/useWorkoutStore'
import { Header } from './components/Header'
import { Calendar } from './components/Calendar'
import { StatsPanel } from './components/StatsPanel'
import { GoalPanel } from './components/GoalPanel'
import { WorkoutDetail } from './components/WorkoutDetail'
import type { MergedDay } from './types'

export default function App() {
  const { days, loading, updateDay, uploadImage, rescheduleDay, swapDays } = useWorkoutStore()
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

        <aside className="hidden lg:flex flex-col gap-4">
          <StatsPanel days={days} />
          <GoalPanel />
        </aside>

        <div className="lg:hidden flex flex-col gap-4">
          <StatsPanel days={days} />
          <GoalPanel />
        </div>
      </main>

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
