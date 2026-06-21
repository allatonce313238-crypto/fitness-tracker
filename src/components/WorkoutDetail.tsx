import { useState, useRef, useEffect } from 'react'
import { X, Upload, Scale, CheckCircle, XCircle, Calendar, Timer } from 'lucide-react'
import { ExerciseChecklist } from './ExerciseChecklist'
import { RescheduleModal } from './RescheduleModal'
import type { MergedDay, RescheduleResult } from '../types'

const TYPE_LABELS: Record<string, string> = {
  weights: 'Weights',
  hiit: 'HIIT',
  cardio: 'Cardio',
  active_recovery: 'Active Recovery',
  rest: 'Rest',
}

const TYPE_COLORS: Record<string, string> = {
  weights: 'var(--accent-green)',
  hiit: 'var(--accent-orange)',
  cardio: 'var(--accent-blue)',
  active_recovery: 'var(--accent-purple)',
  rest: 'var(--accent-gray)',
}

interface Props {
  day: MergedDay
  allDays: MergedDay[]
  onClose: () => void
  onUpdateDay: (dayNumber: number, patch: Record<string, unknown>) => Promise<void>
  onUploadImage: (dayNumber: number, file: File) => Promise<string | null>
  onReschedule: (dayNumber: number, newDate: string) => Promise<RescheduleResult>
}

export function WorkoutDetail({ day, allDays, onClose, onUpdateDay, onUploadImage, onReschedule }: Props) {
  const [notes, setNotes] = useState(day.notes)
  const [bodyWeight, setBodyWeight] = useState<string>(day.bodyWeight?.toString() ?? '')
  const [uploading, setUploading] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync notes/bodyWeight if day changes (different day opened)
  useEffect(() => {
    setNotes(day.notes)
    setBodyWeight(day.bodyWeight?.toString() ?? '')
  }, [day.dayNumber, day.notes, day.bodyWeight])

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive])

  function formatTimer(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function handleToggleExercise(id: string) {
    const next = day.exercisesChecked.includes(id)
      ? day.exercisesChecked.filter((x) => x !== id)
      : [...day.exercisesChecked, id]
    void onUpdateDay(day.dayNumber, { exercises_checked: next })
  }

  function handleNotesChange(val: string) {
    setNotes(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      void onUpdateDay(day.dayNumber, { notes: val })
    }, 800)
  }

  function handleBodyWeightBlur() {
    const num = parseFloat(bodyWeight)
    if (!isNaN(num)) {
      void onUpdateDay(day.dayNumber, { body_weight: num })
    } else if (bodyWeight === '') {
      void onUpdateDay(day.dayNumber, { body_weight: null })
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await onUploadImage(day.dayNumber, file)
    setUploading(false)
  }

  async function markStatus(status: 'completed' | 'skipped') {
    await onUpdateDay(day.dayNumber, {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
  }

  const color = TYPE_COLORS[day.workoutType]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-30 bg-black/50 md:bg-transparent"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-40 w-full md:w-[420px] flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${color}22`, color }}
              >
                Day {day.dayNumber} · {TYPE_LABELS[day.workoutType]}
              </span>
              {day.isRescheduled && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' }}
                >
                  Rescheduled
                </span>
              )}
            </div>
            <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
              {day.title}
            </h2>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {day.currentDate}
            </p>
          </div>
          <button onClick={onClose} className="hover:opacity-70 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Exercise checklist */}
          <Section title="Exercises">
            <ExerciseChecklist
              exercises={day.exercises}
              checked={day.exercisesChecked}
              onToggle={handleToggleExercise}
            />
          </Section>

          {/* Timer */}
          {day.workoutType !== 'rest' && (
            <Section title="Timer">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                  {formatTimer(timerSeconds)}
                </span>
                <button
                  onClick={() => setTimerActive((a) => !a)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}
                >
                  <Timer size={14} />
                  {timerActive ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => { setTimerActive(false); setTimerSeconds(0) }}
                  className="px-3 py-1.5 rounded-lg text-sm transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  Reset
                </button>
              </div>
            </Section>
          )}

          {/* Notes */}
          <Section title="Notes / Journal">
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              placeholder="How did it go? PRs, how you felt…"
              className="w-full rounded-xl p-3 text-sm resize-none outline-none transition-colors"
              style={{
                background: 'var(--bg-surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </Section>

          {/* Body weight */}
          <Section title="Body Weight (kg)">
            <div className="flex items-center gap-2">
              <Scale size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                onBlur={handleBodyWeightBlur}
                placeholder="e.g. 78.5"
                className="w-32 rounded-xl p-2 text-sm font-mono outline-none"
                style={{
                  background: 'var(--bg-surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>kg</span>
            </div>
          </Section>

          {/* Image upload */}
          <Section title="Workout Photo">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {day.imageUrl ? (
              <div className="flex flex-col gap-2">
                <img
                  src={day.imageUrl}
                  alt="Workout"
                  className="w-full rounded-xl object-cover max-h-48"
                  style={{ border: '1px solid var(--border)' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs hover:opacity-70 text-left"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  Replace photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <Upload size={16} style={{ color: 'var(--accent-blue)' }} />
                {uploading ? 'Uploading…' : 'Upload photo'}
              </button>
            )}
          </Section>

          {/* Reschedule */}
          <Section title="">
            <button
              onClick={() => setShowReschedule(true)}
              className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
              style={{ color: 'var(--accent-purple)' }}
            >
              <Calendar size={15} />
              Reschedule this workout
            </button>
          </Section>
        </div>

        {/* Footer CTA */}
        {day.workoutType !== 'rest' && (
          <div
            className="p-5 flex gap-3 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              onClick={() => void markStatus('completed')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
              style={{
                background: day.status === 'completed' ? 'rgba(79,209,165,0.15)' : 'var(--accent-green)',
                color: day.status === 'completed' ? 'var(--accent-green)' : '#0f1117',
                border: day.status === 'completed' ? '1px solid var(--accent-green)' : 'none',
              }}
            >
              <CheckCircle size={16} />
              {day.status === 'completed' ? 'Completed!' : 'Mark Complete'}
            </button>
            <button
              onClick={() => void markStatus('skipped')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
              style={{
                background: day.status === 'skipped' ? 'rgba(245,166,35,0.15)' : 'var(--bg-surface2)',
                color: day.status === 'skipped' ? 'var(--accent-orange)' : 'var(--text-muted)',
                border: `1px solid ${day.status === 'skipped' ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`,
              }}
            >
              <XCircle size={16} />
              Skip
            </button>
          </div>
        )}
      </aside>

      {showReschedule && (
        <RescheduleModal
          day={day}
          allDays={allDays}
          onReschedule={onReschedule}
          onClose={() => setShowReschedule(false)}
        />
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
