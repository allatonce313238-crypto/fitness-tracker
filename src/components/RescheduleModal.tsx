import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { X, AlertTriangle } from 'lucide-react'
import type { MergedDay, RescheduleResult } from '../types'

interface Props {
  day: MergedDay
  allDays: MergedDay[]
  onReschedule: (dayNumber: number, newDate: string) => Promise<RescheduleResult>
  onClose: () => void
}

export function RescheduleModal({ day, allDays, onReschedule, onClose }: Props) {
  const [selected, setSelected] = useState<Date | undefined>()
  const [warning, setWarning] = useState<string | null>(null)
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const occupiedDates = allDays
    .filter((d) => d.dayNumber !== day.dayNumber)
    .map((d) => new Date(d.currentDate + 'T00:00:00'))

  const month = new Date(2026, 6, 1) // July 2026

  async function handleConfirm() {
    const dateStr = pendingDate ?? (selected ? selected.toISOString().slice(0, 10) : null)
    if (!dateStr) return
    setLoading(true)
    const result = await onReschedule(day.dayNumber, dateStr)
    setLoading(false)
    if (!result.ok) {
      setWarning(result.error ?? 'Cannot reschedule to that date.')
      return
    }
    if (result.hiitWarning && !pendingDate) {
      setPendingDate(dateStr)
      setWarning('Warning: This creates back-to-back HIIT days. Click Confirm again to proceed anyway.')
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reschedule Day {day.dayNumber}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:opacity-70">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {day.title} — currently on{' '}
          <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
            {day.currentDate}
          </span>
        </p>

        <div style={{ '--rdp-accent-color': 'var(--accent-blue)' } as React.CSSProperties}>
          <style>{`
            .rdp { --rdp-background-color: var(--bg-surface2); color: var(--text-primary); }
            .rdp-day_selected { background: var(--accent-blue) !important; color: #fff !important; }
            .rdp-day_disabled { color: var(--text-muted) !important; opacity: 0.4; }
            .rdp-day:hover:not(.rdp-day_disabled) { background: var(--bg-surface2); }
            .rdp-head_cell { color: var(--text-muted); font-size: 0.75rem; }
            .rdp-caption_label { color: var(--text-primary); font-size: 0.9rem; }
            .rdp-nav_button { color: var(--text-muted); }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            month={month}
            disabled={[
              ...occupiedDates,
              { before: new Date(2026, 6, 1) },
              { after: new Date(2026, 6, 31) },
            ]}
            fromMonth={month}
            toMonth={month}
          />
        </div>

        {warning && (
          <div
            className="flex items-start gap-2 rounded-lg p-3 text-sm"
            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--accent-orange)' }}
          >
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            {warning}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}
          >
            {loading ? 'Moving…' : warning?.startsWith('Warning') ? 'Confirm Anyway' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
