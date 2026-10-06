import type { AppData } from '../types'
import { calculateSubjectPacing } from './adaptive'
import { analyzeSubjectTrend } from './performance'
import { rankPriorities } from './prioritization'
import { REFERENCE_CAREER_PATHS, analyzeSkillGaps } from './skills'

export interface MasterInsight {
  id: string
  category: 'Academics' | 'Time & Pacing' | 'Study Habits' | 'Skills & Career' | 'Daily Priorities'
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  type: 'alert' | 'positive' | 'tip'
}

// generate a concise set of at most 5 explainable insights across student life domains
export function generateMasterInsights(data: AppData): MasterInsight[] {
  const insights: MasterInsight[] = []

  // 1. ACADEMIC INSIGHT: check for declining marks or strongest subject
  const trendAnalyses = data.subjects.map((s) => analyzeSubjectTrend(s, data.assessments))
  const decliningSubject = trendAnalyses.find((t) => t.trend === 'declining')
  const strongSubject = trendAnalyses.find((t) => t.averagePercentage >= 80 && t.assessments.length >= 2)

  if (decliningSubject) {
    insights.push({
      id: 'ins_acad_declining',
      category: 'Academics',
      title: `${decliningSubject.subjectName} needs immediate review`,
      description: decliningSubject.insight,
      actionLabel: 'View Performance',
      actionLink: '/performance',
      type: 'alert',
    })
  } else if (strongSubject) {
    insights.push({
      id: 'ins_acad_strong',
      category: 'Academics',
      title: `Strong mastery in ${strongSubject.subjectName}`,
      description: `Maintaining an impressive ${strongSubject.averagePercentage}% average across ${strongSubject.assessments.length} assessments.`,
      actionLabel: 'View Performance',
      actionLink: '/performance',
      type: 'positive',
    })
  }

  // 2. TIME & PACING INSIGHT: from learned pacing multipliers
  const pacingList = calculateSubjectPacing(data.subjects, data.sessions)
  const notablePacing = pacingList.find((p) => p.multiplier >= 1.2 || p.multiplier <= 0.8)

  if (notablePacing && notablePacing.sampleSize >= 2) {
    insights.push({
      id: 'ins_time_pacing',
      category: 'Time & Pacing',
      title: `Adaptive Pacing: ${notablePacing.subjectName}`,
      description: notablePacing.insight + ' Future weekly plans automatically adjust study blocks to fit your actual pace.',
      actionLabel: 'View Weekly Schedule',
      actionLink: '/planner',
      type: 'tip',
    })
  }

  // 3. DAILY PRIORITIES INSIGHT: top urgent item
  const ranked = rankPriorities({
    tasks: data.tasks,
    exams: data.exams,
    subjects: data.subjects,
    assessments: data.assessments,
    dailyStudyHoursTarget: data.profile.dailyStudyHoursTarget || 3,
  })

  if (ranked.length > 0) {
    const top = ranked[0]
    insights.push({
      id: 'ins_priority_top',
      category: 'Daily Priorities',
      title: `Top Focus Today: ${top.title}`,
      description: `Prioritized #1 (${top.subjectName}) based on ${top.reasons.slice(0, 2).join('; ')}.`,
      actionLabel: 'Open Planner',
      actionLink: '/planner',
      type: 'alert',
    })
  }

  // 4. SKILLS & CAREER INSIGHT: largest gap for primary career role
  const targetCareerTitle = data.profile.careerGoal || 'Data Scientist'
  const matchedPath =
    REFERENCE_CAREER_PATHS.find((p) => p.title.toLowerCase() === targetCareerTitle.toLowerCase()) ||
    REFERENCE_CAREER_PATHS[0]

  const userRatings: Record<string, number> = {}
  data.skills.forEach((s) => {
    userRatings[s.name] = s.currentLevel
  })

  const skillAnalysis = analyzeSkillGaps(matchedPath, userRatings)
  if (skillAnalysis.nextRecommendedSkill) {
    const nextSkill = skillAnalysis.nextRecommendedSkill
    insights.push({
      id: 'ins_skills_gap',
      category: 'Skills & Career',
      title: `Priority Skill: ${nextSkill.name}`,
      description: `For your target career (${matchedPath.title}), this is your highest-leverage gap (${nextSkill.gap}% below benchmark; Stage ${nextSkill.stage}).`,
      actionLabel: 'Explore Career Navigator',
      actionLink: '/skills',
      type: 'tip',
    })
  }

  // 5. STUDY HABITS INSIGHT: actual minutes vs weekly budget
  if (data.sessions.length > 0) {
    const totalMinutes = data.sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0)
    const totalHours = Number((totalMinutes / 60).toFixed(1))
    const completedSessions = data.sessions.filter((s) => s.status === 'completed').length

    insights.push({
      id: 'ins_habits_logged',
      category: 'Study Habits',
      title: `${completedSessions} Study Sessions Completed`,
      description: `You have logged ${totalHours} total study hours across ${data.sessions.length} sessions. Keep logging to improve pacing accuracy.`,
      actionLabel: 'View Session History',
      actionLink: '/planner',
      type: 'positive',
    })
  }

  // cap strictly at 5 insights max as requested
  return insights.slice(0, 5)
}
