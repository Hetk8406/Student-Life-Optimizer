import type { Assessment, Subject, StudySession } from '../types'

export interface SubjectTrendAnalysis {
  subjectId: string
  subjectName: string
  subjectColor: string
  assessments: Assessment[]
  averagePercentage: number
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
  consecutiveDrops: number
  insight: string
}

export interface SubjectStudyCorrelation {
  subjectName: string
  studyHours: number
  averageScore: number
}

// detect performance trend for a single subject
export function analyzeSubjectTrend(subject: Subject, assessments: Assessment[]): SubjectTrendAnalysis {
  const subMarks = assessments
    .filter((a) => a.subjectId === subject.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (subMarks.length === 0) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      assessments: [],
      averagePercentage: 0,
      trend: 'unknown',
      consecutiveDrops: 0,
      insight: `No marks recorded for ${subject.name} yet.`,
    }
  }

  const total = subMarks.reduce((acc, m) => acc + m.percentage, 0)
  const avg = Number((total / subMarks.length).toFixed(1))

  if (subMarks.length === 1) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      assessments: subMarks,
      averagePercentage: avg,
      trend: 'unknown',
      consecutiveDrops: 0,
      insight: `1 assessment logged (${subMarks[0].percentage}%). Log more to detect trends.`,
    }
  }

  // count consecutive drops from the most recent assessment backwards
  let consecutiveDrops = 0
  for (let i = subMarks.length - 1; i > 0; i--) {
    if (subMarks[i].percentage < subMarks[i - 1].percentage) {
      consecutiveDrops++
    } else {
      break
    }
  }

  const latestPct = subMarks[subMarks.length - 1].percentage
  const firstPct = subMarks[0].percentage
  const diffFromFirst = Number((latestPct - firstPct).toFixed(1))

  let trend: SubjectTrendAnalysis['trend'] = 'stable'
  let insight: string

  if (consecutiveDrops >= 3) {
    trend = 'declining'
    insight = `${subject.name} marks have dropped for ${consecutiveDrops} assessments in a row (latest: ${latestPct}%). Immediate attention recommended.`
  } else if (consecutiveDrops >= 1 && latestPct < avg - 5) {
    trend = 'declining'
    insight = `Recent mark (${latestPct}%) is below your ${avg}% average in ${subject.name}.`
  } else if (diffFromFirst >= 8 || (subMarks.length >= 2 && latestPct > subMarks[subMarks.length - 2].percentage + 5)) {
    trend = 'improving'
    insight = `${subject.name} shows positive progress (${diffFromFirst >= 0 ? '+' : ''}${diffFromFirst}% overall trend).`
  } else {
    trend = 'stable'
    insight = `${subject.name} performance is holding steady at ~${avg}%.`
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectColor: subject.color,
    assessments: subMarks,
    averagePercentage: avg,
    trend,
    consecutiveDrops,
    insight,
  }
}

// compute study time vs marks per subject
export function calculateStudyTimeCorrelation(
  subjects: Subject[],
  assessments: Assessment[],
  sessions: StudySession[]
): SubjectStudyCorrelation[] {
  return subjects
    .map((sub) => {
      const subMarks = assessments.filter((a) => a.subjectId === sub.id)
      const subSessions = sessions.filter((s) => s.subjectId === sub.id)

      if (subMarks.length === 0 || subSessions.length === 0) {
        return null
      }

      const totalScore = subMarks.reduce((acc, m) => acc + m.percentage, 0)
      const avgScore = Number((totalScore / subMarks.length).toFixed(1))

      const totalMins = subSessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0)
      const hours = Number((totalMins / 60).toFixed(1))

      return {
        subjectName: sub.name,
        studyHours: hours,
        averageScore: avgScore,
      }
    })
    .filter((item): item is SubjectStudyCorrelation => item !== null)
}

// generate top plain-English insights across all subjects
export function generatePerformanceInsights(
  analyses: SubjectTrendAnalysis[],
  correlations: SubjectStudyCorrelation[]
): string[] {
  const insights: string[] = []

  // 1. severe consecutive drop alert
  const severeDrop = analyses.find((a) => a.consecutiveDrops >= 3)
  if (severeDrop) {
    insights.push(
      `${severeDrop.subjectName} has declined for ${severeDrop.consecutiveDrops} assessments in a row. Consider reviewing earlier topics.`
    )
  }

  // 2. strong improvement celebration
  const improving = analyses.find((a) => a.trend === 'improving' && a.assessments.length >= 2)
  if (improving && insights.length < 3) {
    insights.push(improving.insight)
  }

  // 3. study time vs marks correlation insight
  if (correlations.length >= 2 && insights.length < 3) {
    const sortedByHours = [...correlations].sort((a, b) => b.studyHours - a.studyHours)
    const mostStudied = sortedByHours[0]
    const leastStudied = sortedByHours[sortedByHours.length - 1]

    if (mostStudied.studyHours >= leastStudied.studyHours + 2) {
      insights.push(
        `You studied ${mostStudied.studyHours}h in ${mostStudied.subjectName} (avg: ${mostStudied.averageScore}%) vs ${leastStudied.studyHours}h in ${leastStudied.subjectName} (avg: ${leastStudied.averageScore}%).`
      )
    }
  }

  return insights.slice(0, 3)
}
