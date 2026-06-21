import { useState } from 'react'

export const GOAL_MONTHS = [
  { key: '2026-07', label: 'July 2026' },
  { key: '2026-08', label: 'August 2026' },
  { key: '2026-09', label: 'September 2026' },
]

export interface MonthlyGoal {
  targetWeight: number | null
  targetFatPct: number | null
}

type GoalsMap = Record<string, MonthlyGoal>

const STORAGE_KEY = 'fitness-goals'

function load(): GoalsMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as GoalsMap
  } catch {
    return {}
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<GoalsMap>(load)

  function setGoal(month: string, field: keyof MonthlyGoal, value: number | null) {
    const prev = goals[month] ?? { targetWeight: null, targetFatPct: null }
    const next: GoalsMap = {
      ...goals,
      [month]: { ...prev, [field]: value },
    }
    setGoals(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { goals, setGoal }
}
