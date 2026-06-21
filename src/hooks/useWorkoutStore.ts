import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { WORKOUT_PLAN } from '../data/workoutPlan'
import type { DayState, MergedDay, RescheduleResult } from '../types'

function mergeData(states: DayState[]): MergedDay[] {
  const stateMap = new Map(states.map((s) => [s.day_number, s]))
  return WORKOUT_PLAN.map((plan) => {
    const s = stateMap.get(plan.dayNumber)
    return {
      ...plan,
      currentDate: s?.scheduled_date ?? plan.date,
      isRescheduled: s?.is_rescheduled ?? false,
      status: s?.status ?? 'pending',
      completedAt: s?.completed_at ?? null,
      exercisesChecked: s?.exercises_checked ?? [],
      notes: s?.notes ?? '',
      imageUrl: s?.image_url ?? null,
      bodyWeight: s?.body_weight ?? null,
    }
  })
}

function buildDefaultState(dayNumber: number, date: string): Omit<DayState, 'id'> {
  return {
    day_number: dayNumber,
    scheduled_date: date,
    original_date: date,
    is_rescheduled: false,
    status: 'pending',
    completed_at: null,
    exercises_checked: [],
    notes: '',
    image_url: null,
    body_weight: null,
  }
}

export function useWorkoutStore() {
  const [days, setDays] = useState<MergedDay[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAndMerge = useCallback(async () => {
    const { data, error } = await supabase.from('workout_days').select('*')
    if (error) {
      console.error('Supabase fetch error:', error)
      setLoading(false)
      return
    }
    const rows = (data ?? []) as DayState[]

    // Seed missing rows on first run
    if (rows.length === 0) {
      const seeds = WORKOUT_PLAN.map((p) => buildDefaultState(p.dayNumber, p.date))
      const { data: seeded, error: seedErr } = await supabase
        .from('workout_days')
        .insert(seeds)
        .select()
      if (seedErr) {
        console.error('Supabase seed error:', seedErr)
      }
      setDays(mergeData((seeded ?? []) as DayState[]))
    } else {
      setDays(mergeData(rows))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchAndMerge()
  }, [fetchAndMerge])

  const updateDay = useCallback(
    async (dayNumber: number, patch: Partial<Omit<DayState, 'day_number'>>) => {
      const plan = WORKOUT_PLAN.find((p) => p.dayNumber === dayNumber)
      if (!plan) return

      const current = days.find((d) => d.dayNumber === dayNumber)
      const upsertRow: Partial<DayState> & { day_number: number; original_date: string; scheduled_date: string } = {
        day_number: dayNumber,
        original_date: plan.date,
        scheduled_date: current?.currentDate ?? plan.date,
        ...patch,
      }

      const { error } = await supabase.from('workout_days').upsert(upsertRow, {
        onConflict: 'day_number',
      })
      if (error) {
        console.error('Supabase upsert error:', error)
        return
      }
      await fetchAndMerge()
    },
    [days, fetchAndMerge],
  )

  const uploadImage = useCallback(
    async (dayNumber: number, file: File): Promise<string | null> => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `day-${dayNumber}/workout.${ext}`
      const { error: upErr } = await supabase.storage
        .from('workout-images')
        .upload(path, file, { upsert: true })
      if (upErr) {
        console.error('Storage upload error:', upErr)
        return null
      }
      const { data } = supabase.storage.from('workout-images').getPublicUrl(path)
      const url = data.publicUrl
      await updateDay(dayNumber, { image_url: url })
      return url
    },
    [updateDay],
  )

  const rescheduleDay = useCallback(
    async (dayNumber: number, newDate: string): Promise<RescheduleResult> => {
      const occupied = days
        .filter((d) => d.dayNumber !== dayNumber)
        .map((d) => d.currentDate)
      if (occupied.includes(newDate)) {
        return { ok: false, error: 'That date is already assigned to another workout.' }
      }

      // Back-to-back HIIT check
      const movingDay = days.find((d) => d.dayNumber === dayNumber)
      const isHiit = movingDay?.workoutType === 'hiit'
      let hiitWarning = false
      if (isHiit) {
        const newDateObj = new Date(newDate)
        const dayBefore = new Date(newDateObj)
        dayBefore.setDate(dayBefore.getDate() - 1)
        const dayAfter = new Date(newDateObj)
        dayAfter.setDate(dayAfter.getDate() + 1)
        const fmt = (d: Date) => d.toISOString().slice(0, 10)
        const neighbours = days.filter(
          (d) =>
            d.dayNumber !== dayNumber &&
            d.workoutType === 'hiit' &&
            (d.currentDate === fmt(dayBefore) || d.currentDate === fmt(dayAfter)),
        )
        hiitWarning = neighbours.length > 0
      }

      await updateDay(dayNumber, { scheduled_date: newDate, is_rescheduled: true })
      return { ok: true, hiitWarning }
    },
    [days, updateDay],
  )

  const swapDays = useCallback(
    async (dayNumberA: number, dayNumberB: number) => {
      const dayA = days.find((d) => d.dayNumber === dayNumberA)
      const dayB = days.find((d) => d.dayNumber === dayNumberB)
      const planA = WORKOUT_PLAN.find((p) => p.dayNumber === dayNumberA)
      const planB = WORKOUT_PLAN.find((p) => p.dayNumber === dayNumberB)
      if (!dayA || !dayB || !planA || !planB) return

      const dateA = dayA.currentDate
      const dateB = dayB.currentDate

      // Optimistic update — swap dates in local state immediately so UI responds instantly
      setDays((prev) =>
        prev.map((d) => {
          if (d.dayNumber === dayNumberA) return { ...d, currentDate: dateB, isRescheduled: dateB !== planA.date }
          if (d.dayNumber === dayNumberB) return { ...d, currentDate: dateA, isRescheduled: dateA !== planB.date }
          return d
        }),
      )

      // Persist to Supabase in background
      const [resA, resB] = await Promise.all([
        supabase.from('workout_days').upsert(
          { day_number: dayNumberA, original_date: planA.date, scheduled_date: dateB, is_rescheduled: dateB !== planA.date },
          { onConflict: 'day_number' },
        ),
        supabase.from('workout_days').upsert(
          { day_number: dayNumberB, original_date: planB.date, scheduled_date: dateA, is_rescheduled: dateA !== planB.date },
          { onConflict: 'day_number' },
        ),
      ])

      if (resA.error ?? resB.error) {
        console.error('Swap Supabase error:', resA.error ?? resB.error)
        // Revert optimistic update on Supabase failure
        setDays((prev) =>
          prev.map((d) => {
            if (d.dayNumber === dayNumberA) return { ...d, currentDate: dateA, isRescheduled: dateA !== planA.date }
            if (d.dayNumber === dayNumberB) return { ...d, currentDate: dateB, isRescheduled: dateB !== planB.date }
            return d
          }),
        )
      }
    },
    [days],
  )

  return { days, loading, updateDay, uploadImage, rescheduleDay, swapDays }
}
