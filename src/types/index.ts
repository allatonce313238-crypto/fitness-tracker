export type WorkoutType = 'weights' | 'hiit' | 'cardio' | 'active_recovery' | 'rest'

export type Status = 'pending' | 'completed' | 'skipped'

export interface Exercise {
  id: string
  name: string
  sets?: number
  reps?: number | string
  duration?: string
}

export interface WorkoutDay {
  dayNumber: number
  date: string
  workoutType: WorkoutType
  title: string
  exercises: Exercise[]
}

export interface DayState {
  day_number: number
  scheduled_date: string
  original_date: string
  is_rescheduled: boolean
  status: Status
  completed_at: string | null
  exercises_checked: string[]
  notes: string
  image_url: string | null
  body_weight: number | null
}

export interface MergedDay extends WorkoutDay {
  currentDate: string
  isRescheduled: boolean
  status: Status
  completedAt: string | null
  exercisesChecked: string[]
  notes: string
  imageUrl: string | null
  bodyWeight: number | null
}

export interface RescheduleResult {
  ok: boolean
  hiitWarning?: boolean
  error?: string
}
