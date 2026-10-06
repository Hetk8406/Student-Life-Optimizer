import type { Exam, Assessment, Topic } from '../types'
import { getDaysBetween } from './prioritization'

// weights configuration for exam readiness (sums to 100)
export const READINESS_WEIGHTS = {
  coverage: 35,     // syllabus topics completed weighted by importance
  confidence: 30,   // self-rated confidence weighted by importance
  recentMarks: 25,  // past marks in this subject
  timeAdequacy: 10, // days left compared to remaining topics
}

export interface ExamReadinessResult {
  score: number // 0 to 100
  strongTopics: Topic[]
  weakTopics: Topic[]
  remainingTopics: Topic[]
  priorityTopics: Topic[]
  daysLeft: number
  recommendedStudyHours: number
  reasons: string[]
}

// compute exam readiness percentage and full explanatory breakdown
export function calculateExamReadiness({
  exam,
  assessments,
  currentDate,
}: {
  exam: Exam
  assessments: Assessment[]
  currentDate?: string
}): ExamReadinessResult {
  const topics = exam.topics || []
  const daysLeft = getDaysBetween(exam.date, currentDate)
  const reasons: string[] = []

  // 1. syllabus coverage (weighted by topic weight 1-5)
  let coverageScore = 50
  if (topics.length > 0) {
    const totalWeight = topics.reduce((acc, t) => acc + (t.weight || 3), 0)
    const completedWeight = topics
      .filter((t) => t.completed)
      .reduce((acc, t) => acc + (t.weight || 3), 0)

    coverageScore = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0
    reasons.push(
      `${Math.round(coverageScore)}% syllabus completed (${topics.filter((t) => t.completed).length}/${topics.length} topics)`
    )
  } else {
    reasons.push('No syllabus topics listed yet (assuming 50% baseline)')
  }

  // 2. topic confidence (weighted by importance, scaled 1..5 -> 0..100)
  let confidenceScore = 50
  if (topics.length > 0) {
    const totalWeight = topics.reduce((acc, t) => acc + (t.weight || 3), 0)
    const weightedConfSum = topics.reduce(
      (acc, t) => acc + (t.confidence || 3) * (t.weight || 3),
      0
    )
    const avgConf = totalWeight > 0 ? weightedConfSum / totalWeight : 3
    // scale 1..5 to 0..100
    confidenceScore = Math.max(0, Math.min(100, ((avgConf - 1) / 4) * 100))
  }

  // 3. recent subject marks
  const subMarks = assessments
    .filter((a) => a.subjectId === exam.subjectId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let marksScore = 65 // neutral fallback if no marks logged yet
  if (subMarks.length > 0) {
    const totalPct = subMarks.reduce((acc, m) => acc + m.percentage, 0)
    marksScore = totalPct / subMarks.length
    reasons.push(`Subject past average is ${Math.round(marksScore)}% across ${subMarks.length} assessment(s)`)
  } else {
    reasons.push('No marks logged for this subject yet (using neutral 65% baseline)')
  }

  // 4. time adequacy
  let timeScore = 50
  if (daysLeft < 0) {
    timeScore = 0
    reasons.push('Exam date has already passed')
  } else if (daysLeft === 0) {
    timeScore = 30
    reasons.push('Exam is today')
  } else if (daysLeft <= 2) {
    timeScore = 40
    reasons.push(`Only ${daysLeft} day(s) left`)
  } else if (daysLeft <= 6) {
    timeScore = 75
    reasons.push(`${daysLeft} days remaining`)
  } else {
    timeScore = 100
    reasons.push(`${daysLeft} days remaining (comfortable study window)`)
  }

  // weighted total calculation
  const totalScore =
    (coverageScore * READINESS_WEIGHTS.coverage +
      confidenceScore * READINESS_WEIGHTS.confidence +
      marksScore * READINESS_WEIGHTS.recentMarks +
      timeScore * READINESS_WEIGHTS.timeAdequacy) /
    100

  // topic categorization
  const strongTopics = topics.filter((t) => t.confidence >= 4)
  const weakTopics = topics.filter((t) => t.confidence <= 2)
  const remainingTopics = topics.filter((t) => !t.completed)

  // priority topics: high weight (>=3) and not yet mastered (confidence <= 3)
  const priorityTopics = topics
    .filter((t) => (t.weight >= 3 && t.confidence <= 3) || !t.completed)
    .sort((a, b) => b.weight - a.weight || a.confidence - b.confidence)

  if (weakTopics.length > 0) {
    reasons.push(`${weakTopics.length} weak topic(s) need immediate revision`)
  }

  // recommended study hours: roughly 1.5h per remaining topic, minimum 1h
  const uncompletedWeight = remainingTopics.reduce((acc, t) => acc + (t.weight || 3), 0)
  const recommendedHours = Math.max(1, Math.round(uncompletedWeight * 0.8))

  return {
    score: Math.max(0, Math.min(100, Math.round(totalScore))),
    strongTopics,
    weakTopics,
    remainingTopics,
    priorityTopics,
    daysLeft,
    recommendedStudyHours: recommendedHours,
    reasons,
  }
}
