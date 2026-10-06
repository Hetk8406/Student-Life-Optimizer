import { describe, it, expect } from 'vitest'
import {
  analyzeSubjectTrend,
  calculateStudyTimeCorrelation,
  generatePerformanceInsights,
} from './performance'
import type { Subject, Assessment, StudySession } from '../types'

describe('Performance Analytics Engine', () => {
  const mockSubject: Subject = {
    id: 'sub_stats',
    name: 'Statistics',
    color: '#3b82f6',
    targetGrade: 80,
  }

  it('detects 3 drops in a row and flags a declining trend', () => {
    // 4 assessments with 3 consecutive drops: 85% -> 75% -> 65% -> 55%
    const assessments: Assessment[] = [
      { id: '1', subjectId: 'sub_stats', title: 'Q1', type: 'quiz', score: 85, maxScore: 100, percentage: 85, date: '2026-09-01' },
      { id: '2', subjectId: 'sub_stats', title: 'Q2', type: 'quiz', score: 75, maxScore: 100, percentage: 75, date: '2026-09-10' },
      { id: '3', subjectId: 'sub_stats', title: 'Q3', type: 'quiz', score: 65, maxScore: 100, percentage: 65, date: '2026-09-20' },
      { id: '4', subjectId: 'sub_stats', title: 'Q4', type: 'quiz', score: 55, maxScore: 100, percentage: 55, date: '2026-09-30' },
    ]

    const analysis = analyzeSubjectTrend(mockSubject, assessments)

    expect(analysis.consecutiveDrops).toBe(3)
    expect(analysis.trend).toBe('declining')
    expect(analysis.insight).toContain('dropped for 3 assessments in a row')
  })

  it('detects an improving trend', () => {
    // scores going from 60% -> 75% -> 85%
    const assessments: Assessment[] = [
      { id: '1', subjectId: 'sub_stats', title: 'Q1', type: 'quiz', score: 60, maxScore: 100, percentage: 60, date: '2026-09-01' },
      { id: '2', subjectId: 'sub_stats', title: 'Q2', type: 'quiz', score: 75, maxScore: 100, percentage: 75, date: '2026-09-10' },
      { id: '3', subjectId: 'sub_stats', title: 'Q3', type: 'quiz', score: 85, maxScore: 100, percentage: 85, date: '2026-09-20' },
    ]

    const analysis = analyzeSubjectTrend(mockSubject, assessments)

    expect(analysis.trend).toBe('improving')
    expect(analysis.consecutiveDrops).toBe(0)
    expect(analysis.insight).toContain('shows positive progress')
  })

  it('computes study hours vs marks correlation accurately', () => {
    const mathSub: Subject = { id: 's1', name: 'Math', color: '#10b981', targetGrade: 80 }
    const csSub: Subject = { id: 's2', name: 'CS', color: '#8b5cf6', targetGrade: 80 }

    const assessments: Assessment[] = [
      { id: 'a1', subjectId: 's1', title: 'M1', type: 'quiz', score: 80, maxScore: 100, percentage: 80, date: '2026-10-01' },
      { id: 'a2', subjectId: 's2', title: 'C1', type: 'quiz', score: 90, maxScore: 100, percentage: 90, date: '2026-10-01' },
    ]

    const sessions: StudySession[] = [
      // 120 mins = 2.0 hrs for Math
      { id: 'ss1', subjectId: 's1', plannedMinutes: 60, actualMinutes: 120, status: 'completed', difficulty: 3, date: '2026-10-01' },
      // 240 mins = 4.0 hrs for CS
      { id: 'ss2', subjectId: 's2', plannedMinutes: 60, actualMinutes: 240, status: 'completed', difficulty: 3, date: '2026-10-01' },
    ]

    const correlation = calculateStudyTimeCorrelation([mathSub, csSub], assessments, sessions)

    expect(correlation.length).toBe(2)
    const math = correlation.find((c) => c.subjectName === 'Math')
    expect(math?.studyHours).toBe(2)
    expect(math?.averageScore).toBe(80)

    const cs = correlation.find((c) => c.subjectName === 'CS')
    expect(cs?.studyHours).toBe(4)
    expect(cs?.averageScore).toBe(90)

    const insights = generatePerformanceInsights([], correlation)
    expect(insights.length).toBeGreaterThan(0)
  })

  it('handles empty assessments safely', () => {
    const analysis = analyzeSubjectTrend(mockSubject, [])
    expect(analysis.trend).toBe('unknown')
    expect(analysis.averagePercentage).toBe(0)
  })
})
