import type { Task, Exam, Subject, Assessment } from '../types'

// all weights in one place (sums to 100) so they can be easily tuned
export const PRIORITY_WEIGHTS = {
  urgency: 40,    // how close is the deadline or exam
  weakness: 25,   // low or declining marks in this subject
  difficulty: 15, // how tough the task or exam is
  importance: 15, // task type or topic weight in exam
  timeFit: 5,     // how well it fits into daily study budget
}

export interface RankedPriorityItem {
  id: string
  title: string
  subjectId: string
  subjectName: string
  subjectColor: string
  itemType: 'task' | 'exam'
  suggestedMinutes: number
  score: number
  reasons: string[]
  dueDate?: string
  daysLeft?: number
}

export interface SubjectStats {
  subjectId: string
  name: string
  color: string
  averagePercentage: number | null
  assessmentCount: number
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
  recentScoreDiff?: number
}

// helper to calculate days between two YYYY-MM-DD dates
export function getDaysBetween(targetDateStr: string, baseDateStr?: string): number {
  const target = new Date(targetDateStr)
  const base = baseDateStr ? new Date(baseDateStr) : new Date()

  // normalize to midnight
  target.setHours(0, 0, 0, 0)
  base.setHours(0, 0, 0, 0)

  const diffMs = target.getTime() - base.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// compute subject performance and grade trends
export function calculateSubjectStats(
  subjects: Subject[],
  assessments: Assessment[]
): SubjectStats[] {
  return subjects.map((sub) => {
    // get assessments for this subject sorted by date ascending
    const subMarks = assessments
      .filter((a) => a.subjectId === sub.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (subMarks.length === 0) {
      return {
        subjectId: sub.id,
        name: sub.name,
        color: sub.color,
        averagePercentage: null,
        assessmentCount: 0,
        trend: 'unknown',
      }
    }

    const totalPct = subMarks.reduce((acc, m) => acc + m.percentage, 0)
    const avg = Number((totalPct / subMarks.length).toFixed(1))

    // trend: compare latest mark with previous mark if we have at least 2 marks
    let trend: SubjectStats['trend'] = 'stable'
    let recentScoreDiff: number | undefined

    if (subMarks.length >= 2) {
      const latest = subMarks[subMarks.length - 1].percentage
      const previous = subMarks[subMarks.length - 2].percentage
      recentScoreDiff = Number((latest - previous).toFixed(1))

      if (recentScoreDiff <= -5) {
        trend = 'declining'
      } else if (recentScoreDiff >= 5) {
        trend = 'improving'
      } else {
        trend = 'stable'
      }
    }

    return {
      subjectId: sub.id,
      name: sub.name,
      color: sub.color,
      averagePercentage: avg,
      assessmentCount: subMarks.length,
      trend,
      recentScoreDiff,
    }
  })
}

// calculate weakness score (0-100) and rationale for a subject
function getWeaknessScore(stats?: SubjectStats): { score: number; reason?: string } {
  if (!stats || stats.averagePercentage === null) {
    // neutral baseline when no marks are recorded yet
    return { score: 40 }
  }

  let score = 40
  const avg = stats.averagePercentage

  if (avg < 50) {
    score = 95
  } else if (avg < 65) {
    score = 75
  } else if (avg < 75) {
    score = 55
  } else if (avg < 85) {
    score = 30
  } else {
    score = 15 // strong subject
  }

  let reason: string | undefined

  if (stats.trend === 'declining' && stats.recentScoreDiff !== undefined) {
    // boost weakness score if marks dropped recently
    score = Math.min(100, score + 20)
    reason = `Recent marks dropped by ${Math.abs(stats.recentScoreDiff)}% (average is ${avg}%)`
  } else if (avg < 60) {
    reason = `Weak subject average of ${avg}% needs focus`
  } else if (stats.trend === 'improving') {
    reason = `Performance improving (${avg}% avg)`
  }

  return { score, reason }
}

// calculate urgency score (0-100) and reason from days left
function getUrgencyScore(daysLeft?: number): { score: number; reason?: string } {
  if (daysLeft === undefined) {
    return { score: 20 }
  }

  if (daysLeft < 0) {
    return { score: 100, reason: `Overdue by ${Math.abs(daysLeft)} day(s)` }
  }
  if (daysLeft === 0) {
    return { score: 100, reason: 'Due today' }
  }
  if (daysLeft === 1) {
    return { score: 90, reason: 'Due tomorrow' }
  }
  if (daysLeft <= 3) {
    return { score: 80, reason: `Urgent: only ${daysLeft} days remaining` }
  }
  if (daysLeft <= 7) {
    return { score: 60, reason: `Coming up in ${daysLeft} days` }
  }
  if (daysLeft <= 14) {
    return { score: 35, reason: `Due in ${daysLeft} days` }
  }
  return { score: 15 }
}

// main prioritization ranking function
export function rankPriorities({
  tasks,
  exams,
  subjects,
  assessments,
  dailyStudyHoursTarget = 3,
  currentDate,
}: {
  tasks: Task[]
  exams: Exam[]
  subjects: Subject[]
  assessments: Assessment[]
  dailyStudyHoursTarget?: number
  currentDate?: string
}): RankedPriorityItem[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]))
  const subjectStatsList = calculateSubjectStats(subjects, assessments)
  const statsMap = new Map(subjectStatsList.map((st) => [st.subjectId, st]))

  const rankedItems: RankedPriorityItem[] = []

  // 1. score pending tasks
  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'cancelled') continue

    const subject = subjectMap.get(task.subjectId)
    const stats = statsMap.get(task.subjectId)
    const reasons: string[] = []

    // urgency
    let daysLeft: number | undefined
    if (task.dueDate) {
      daysLeft = getDaysBetween(task.dueDate, currentDate)
    }
    const urgency = getUrgencyScore(daysLeft)
    if (urgency.reason) reasons.push(urgency.reason)

    // subject weakness
    const weakness = getWeaknessScore(stats)
    if (weakness.reason) reasons.push(weakness.reason)

    // difficulty (1-5 scaled to 0-100)
    const diffVal = task.difficulty || 3
    const difficultyScore = (diffVal / 5) * 100
    if (diffVal >= 4) {
      reasons.push(`Challenging task (${diffVal}/5 difficulty)`)
    }

    // importance (based on task type)
    let importanceScore = 50
    if (task.type === 'assignment' || task.type === 'project') {
      importanceScore = 80
      reasons.push(`Graded ${task.type}`)
    } else if (task.type === 'exam_prep') {
      importanceScore = 90
      reasons.push('Exam preparation task')
    } else if (task.type === 'revision') {
      importanceScore = 60
    }

    // time fit: how well it fits in today's hours
    const availableMinutes = dailyStudyHoursTarget * 60
    const est = task.estimatedMinutes || 60
    let timeFitScore = 60

    if (est <= availableMinutes) {
      timeFitScore = 80
      if (est >= 60) {
        reasons.push(`Takes ${est} min of today's ${dailyStudyHoursTarget}h budget`)
      }
    } else {
      timeFitScore = 40
      reasons.push(`Long task (${est} min) - consider splitting`)
    }

    // weighted total
    const totalScore =
      (urgency.score * PRIORITY_WEIGHTS.urgency +
        weakness.score * PRIORITY_WEIGHTS.weakness +
        difficultyScore * PRIORITY_WEIGHTS.difficulty +
        importanceScore * PRIORITY_WEIGHTS.importance +
        timeFitScore * PRIORITY_WEIGHTS.timeFit) /
      100

    // fallback reason if list is empty
    if (reasons.length === 0) {
      reasons.push(`Standard ${task.type} study block`)
    }

    rankedItems.push({
      id: task.id,
      title: task.title,
      subjectId: task.subjectId,
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#3b82f6',
      itemType: 'task',
      suggestedMinutes: Math.min(120, est),
      score: Math.round(totalScore),
      reasons,
      dueDate: task.dueDate,
      daysLeft,
    })
  }

  // 2. score upcoming exams (within next 14 days)
  for (const exam of exams) {
    const daysLeft = getDaysBetween(exam.date, currentDate)

    // ignore past exams
    if (daysLeft < 0) continue

    const subject = subjectMap.get(exam.subjectId)
    const stats = statsMap.get(exam.subjectId)
    const reasons: string[] = []

    // urgency for exams is higher priority
    const urgency = getUrgencyScore(daysLeft)
    if (urgency.reason) {
      reasons.push(`Exam: ${urgency.reason}`)
    }

    // subject weakness
    const weakness = getWeaknessScore(stats)
    if (weakness.reason) {
      reasons.push(weakness.reason)
    }

    // difficulty based on topic confidence
    let difficultyScore = 60
    if (exam.topics && exam.topics.length > 0) {
      const avgConfidence =
        exam.topics.reduce((acc, t) => acc + (t.confidence || 3), 0) / exam.topics.length
      // lower confidence = higher difficulty
      difficultyScore = ((6 - avgConfidence) / 5) * 100

      const weakTopics = exam.topics.filter((t) => t.confidence <= 2)
      if (weakTopics.length > 0) {
        reasons.push(`${weakTopics.length} topic(s) rated low confidence`)
      }
    }

    // importance (exams are naturally high weight)
    const importanceScore = 95
    reasons.push('Upcoming syllabus milestone')

    // time fit: recommend a 60-90m study session
    const suggestedMinutes = daysLeft <= 3 ? 90 : 60
    const timeFitScore = 80

    // weighted total
    const totalScore =
      (urgency.score * PRIORITY_WEIGHTS.urgency +
        weakness.score * PRIORITY_WEIGHTS.weakness +
        difficultyScore * PRIORITY_WEIGHTS.difficulty +
        importanceScore * PRIORITY_WEIGHTS.importance +
        timeFitScore * PRIORITY_WEIGHTS.timeFit) /
      100

    rankedItems.push({
      id: exam.id,
      title: `Prepare for ${exam.title}`,
      subjectId: exam.subjectId,
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#8b5cf6',
      itemType: 'exam',
      suggestedMinutes,
      score: Math.round(totalScore),
      reasons,
      dueDate: exam.date,
      daysLeft,
    })
  }

  // sort descending by score
  return rankedItems.sort((a, b) => b.score - a.score)
}

// generate 1-2 practical insights for the student dashboard
export function generateDashboardInsights(
  stats: SubjectStats[],
  rankedItems: RankedPriorityItem[]
): string[] {
  const insights: string[] = []

  // 1. check for declining performance
  const declining = stats.find((s) => s.trend === 'declining')
  if (declining && declining.recentScoreDiff !== undefined) {
    insights.push(
      `${declining.name} marks recently dropped by ${Math.abs(declining.recentScoreDiff)}%. Spending 30% more time here this week can prevent further grade decline.`
    )
  }

  // 2. check for urgent upcoming exam
  const urgentExam = rankedItems.find((item) => item.itemType === 'exam' && item.daysLeft !== undefined && item.daysLeft <= 4)
  if (urgentExam && insights.length < 2) {
    insights.push(
      `${urgentExam.title} is coming up in ${urgentExam.daysLeft} days. We've prioritized it at the top of today's study queue.`
    )
  }

  // 3. check if study load is well distributed
  if (insights.length < 2 && rankedItems.length >= 3) {
    const topItem = rankedItems[0]
    insights.push(
      `Your highest leverage task today is "${topItem.title}" (${topItem.subjectName}) based on urgency and topic weight.`
    )
  }

  return insights.slice(0, 2)
}
