import { describe, it, expect } from 'vitest'
import { calculateExamReadiness } from './readiness'
import type { Exam, Assessment } from '../types'

describe('Exam Readiness Engine', () => {
  it('computes a high readiness score when coverage, confidence, and past marks are strong', () => {
    const exam: Exam = {
      id: 'e1',
      subjectId: 'sub_math',
      title: 'Calculus Final',
      date: '2026-10-25', // 15 days out
      targetScore: 85,
      topics: [
        { id: 't1', name: 'Limits', weight: 4, confidence: 5, completed: true },
        { id: 't2', name: 'Derivatives', weight: 5, confidence: 4, completed: true },
        { id: 't3', name: 'Integrals', weight: 5, confidence: 4, completed: true },
      ],
    }

    const assessments: Assessment[] = [
      {
        id: 'a1',
        subjectId: 'sub_math',
        title: 'Midterm',
        type: 'midterm',
        score: 90,
        maxScore: 100,
        percentage: 90,
        date: '2026-10-01',
      },
    ]

    const result = calculateExamReadiness({
      exam,
      assessments,
      currentDate: '2026-10-10',
    })

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.strongTopics.length).toBe(3)
    expect(result.weakTopics.length).toBe(0)
    expect(result.remainingTopics.length).toBe(0)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('computes low readiness score when syllabus is incomplete and confidence is low', () => {
    const exam: Exam = {
      id: 'e2',
      subjectId: 'sub_cs',
      title: 'Operating Systems Midterm',
      date: '2026-10-12', // 2 days out!
      targetScore: 80,
      topics: [
        { id: 't1', name: 'Virtual Memory', weight: 5, confidence: 1, completed: false },
        { id: 't2', name: 'File Systems', weight: 4, confidence: 2, completed: false },
        { id: 't3', name: 'Processes', weight: 3, confidence: 4, completed: true },
      ],
    }

    const assessments: Assessment[] = [
      {
        id: 'a2',
        subjectId: 'sub_cs',
        title: 'Quiz 1',
        type: 'quiz',
        score: 10,
        maxScore: 20,
        percentage: 50,
        date: '2026-10-01',
      },
    ]

    const result = calculateExamReadiness({
      exam,
      assessments,
      currentDate: '2026-10-10',
    })

    expect(result.score).toBeLessThan(60)
    expect(result.weakTopics.length).toBe(2)
    expect(result.remainingTopics.length).toBe(2)
    expect(result.priorityTopics.some((t) => t.name === 'Virtual Memory')).toBe(true)
    expect(result.recommendedStudyHours).toBeGreaterThan(0)
  })

  it('handles exams with no assessments gracefully', () => {
    const exam: Exam = {
      id: 'e3',
      subjectId: 'sub_new',
      title: 'New Subject Exam',
      date: '2026-10-20',
      targetScore: 75,
      topics: [
        { id: 't1', name: 'Intro', weight: 3, confidence: 3, completed: true },
      ],
    }

    const result = calculateExamReadiness({
      exam,
      assessments: [],
      currentDate: '2026-10-10',
    })

    expect(result.score).toBeGreaterThan(0)
    expect(result.reasons.some((r) => r.includes('No marks logged'))).toBe(true)
  })
})
