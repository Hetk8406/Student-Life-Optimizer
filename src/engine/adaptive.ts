import type { StudySession, Task, Exam, Subject, Assessment } from '../types'
import { rankPriorities, getDaysBetween } from './prioritization'

export interface PacingCorrection {
  subjectId: string
  subjectName: string
  multiplier: number // e.g. 1.3 means student takes 30% longer
  sampleSize: number
  insight: string // human-readable explanation
}

export interface WeeklyStudyBlock {
  id: string
  date: string // YYYY-MM-DD
  dayLabel: string // e.g. "Mon, Oct 12"
  subjectId: string
  subjectName: string
  subjectColor: string
  title: string
  plannedMinutes: number
  originalMinutes: number
  reason: string
  taskId?: string
  examId?: string
  isLogged: boolean
  session?: StudySession
}

// minimum number of logged sessions required before applying a pacing correction
const MIN_SESSIONS_FOR_PACING = 2

// calculate pacing correction factor for each subject based on past study sessions
export function calculateSubjectPacing(
  subjects: Subject[],
  sessions: StudySession[]
): PacingCorrection[] {
  return subjects.map((sub) => {
    // only look at completed or partial sessions with valid times
    const subSessions = sessions.filter(
      (s) =>
        s.subjectId === sub.id &&
        s.status !== 'skipped' &&
        s.plannedMinutes > 0 &&
        s.actualMinutes > 0
    )

    if (subSessions.length < MIN_SESSIONS_FOR_PACING) {
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        multiplier: 1.0,
        sampleSize: subSessions.length,
        insight: `Not enough session logs yet for ${sub.name} (need at least ${MIN_SESSIONS_FOR_PACING}).`,
      }
    }

    const totalPlanned = subSessions.reduce((acc, s) => acc + s.plannedMinutes, 0)
    const totalActual = subSessions.reduce((acc, s) => acc + s.actualMinutes, 0)

    // raw ratio of actual time to planned time
    const rawRatio = totalActual / totalPlanned

    // clamp multiplier between 0.6x (finishes fast) and 1.8x (takes long)
    const multiplier = Number(Math.max(0.6, Math.min(1.8, rawRatio)).toFixed(2))
    const pctDiff = Math.round(Math.abs(multiplier - 1.0) * 100)

    let insight: string
    if (multiplier >= 1.15) {
      insight = `You usually take ~${pctDiff}% longer on ${sub.name} (based on ${subSessions.length} sessions).`
    } else if (multiplier <= 0.85) {
      insight = `You usually finish ~${pctDiff}% faster on ${sub.name} (based on ${subSessions.length} sessions).`
    } else {
      insight = `Your time estimates for ${sub.name} are well on track (within ±10%).`
    }

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      multiplier,
      sampleSize: subSessions.length,
      insight,
    }
  })
}

// generate a realistic 7-day study plan distributing high-priority tasks
export function generateWeeklyPlan({
  tasks,
  exams,
  subjects,
  assessments,
  sessions,
  weeklyAvailableHours = 20,
  startDate,
}: {
  tasks: Task[]
  exams: Exam[]
  subjects: Subject[]
  assessments: Assessment[]
  sessions: StudySession[]
  weeklyAvailableHours?: number
  startDate?: string
}): WeeklyStudyBlock[] {
  // 1. calculate pacing corrections per subject
  const pacingList = calculateSubjectPacing(subjects, sessions)
  const pacingMap = new Map(pacingList.map((p) => [p.subjectId, p]))

  // 2. get ranked priority items from engine
  const dailyTargetHours = Number((weeklyAvailableHours / 7).toFixed(1))
  const ranked = rankPriorities({
    tasks,
    exams,
    subjects,
    assessments,
    dailyStudyHoursTarget: dailyTargetHours,
    currentDate: startDate,
  })

  // daily budget in minutes (cap daily study load)
  const dailyMinutesBudget = Math.round(dailyTargetHours * 60)

  // 3. prepare next 7 days
  const base = startDate ? new Date(startDate) : new Date()
  const days: { dateStr: string; label: string; remainingMinutes: number }[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    days.push({
      dateStr,
      label: i === 0 ? `Today (${label})` : i === 1 ? `Tomorrow (${label})` : label,
      remainingMinutes: dailyMinutesBudget,
    })
  }

  const scheduledBlocks: WeeklyStudyBlock[] = []
  let blockCounter = 1

  // 4. distribute priority items into days
  for (const item of ranked) {
    const pacing = pacingMap.get(item.subjectId)
    const multiplier = pacing?.multiplier || 1.0

    // apply adaptive correction to original estimated minutes
    const originalMins = item.suggestedMinutes
    const adjustedMins = Math.round(originalMins * multiplier)

    // find earliest day with enough budget, or day with most remaining budget
    let targetDay = days.find((d) => d.remainingMinutes >= 30)

    // if item has a specific due date within the 7 days, schedule before that date
    if (item.dueDate) {
      const daysUntilDue = getDaysBetween(item.dueDate, startDate)
      if (daysUntilDue >= 0 && daysUntilDue < 7) {
        // find day on or before the due date
        const possibleDays = days.slice(0, Math.max(1, daysUntilDue + 1))
        targetDay = possibleDays.find((d) => d.remainingMinutes >= 30) || possibleDays[0]
      }
    }

    // fallback to first day if all days are packed
    if (!targetDay) {
      targetDay = days[0]
    }

    // build human-readable reason
    let reasonText = item.reasons[0] || 'High priority study item'
    if (multiplier > 1.1) {
      reasonText += ` (adjusted +${Math.round((multiplier - 1) * 100)}% time from past pacing)`
    } else if (multiplier < 0.9) {
      reasonText += ` (adjusted -${Math.round((1 - multiplier) * 100)}% time based on past pacing)`
    }

    // check if this block has already been logged in sessions
    const loggedSession = sessions.find(
      (s) => s.taskId === item.id && s.date === targetDay?.dateStr
    )

    scheduledBlocks.push({
      id: `block_${blockCounter++}_${item.id}`,
      date: targetDay.dateStr,
      dayLabel: targetDay.label,
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      subjectColor: item.subjectColor,
      title: item.title,
      plannedMinutes: adjustedMins,
      originalMinutes: originalMins,
      reason: reasonText,
      taskId: item.itemType === 'task' ? item.id : undefined,
      examId: item.itemType === 'exam' ? item.id : undefined,
      isLogged: !!loggedSession,
      session: loggedSession,
    })

    // deduct from day's remaining budget
    targetDay.remainingMinutes -= adjustedMins
  }

  return scheduledBlocks
}
