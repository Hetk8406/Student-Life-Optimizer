import { describe, it, expect } from 'vitest'
import { rankPriorities, calculateSubjectStats } from './prioritization'
import type { Task, Subject, Assessment } from '../types'

describe('Prioritization Engine', () => {
  const mockSubjects: Subject[] = [
    { id: 'sub_math', name: 'Mathematics', color: '#3b82f6', targetGrade: 80 },
    { id: 'sub_cs', name: 'Data Structures', color: '#10b981', targetGrade: 85 },
  ]

  it('prioritizes urgent tasks over distant tasks', () => {
    const today = '2026-10-10'

    const urgentTask: Task = {
      id: 'task_1',
      subjectId: 'sub_math',
      title: 'Math Assignment 1',
      type: 'assignment',
      dueDate: '2026-10-11', // due tomorrow
      estimatedMinutes: 60,
      difficulty: 3,
      status: 'pending',
    }

    const distantTask: Task = {
      id: 'task_2',
      subjectId: 'sub_math',
      title: 'Math Assignment 2',
      type: 'assignment',
      dueDate: '2026-10-30', // due in 20 days
      estimatedMinutes: 60,
      difficulty: 3,
      status: 'pending',
    }

    const ranked = rankPriorities({
      tasks: [distantTask, urgentTask],
      exams: [],
      subjects: mockSubjects,
      assessments: [],
      currentDate: today,
    })

    expect(ranked[0].id).toBe('task_1')
    expect(ranked[0].reasons.some((r) => r.includes('Due tomorrow'))).toBe(true)
  })

  it('boosts priority for subjects with dropping marks', () => {
    const today = '2026-10-10'

    // Math has declining scores: 80% down to 55%
    const assessments: Assessment[] = [
      {
        id: 'ass_1',
        subjectId: 'sub_math',
        title: 'Quiz 1',
        type: 'quiz',
        score: 16,
        maxScore: 20,
        percentage: 80,
        date: '2026-09-20',
      },
      {
        id: 'ass_2',
        subjectId: 'sub_math',
        title: 'Quiz 2',
        type: 'quiz',
        score: 11,
        maxScore: 20,
        percentage: 55, // dropped by 25%
        date: '2026-10-01',
      },
      {
        id: 'ass_3',
        subjectId: 'sub_cs',
        title: 'CS Lab',
        type: 'assignment',
        score: 19,
        maxScore: 20,
        percentage: 95, // strong
        date: '2026-10-01',
      },
    ]

    const mathTask: Task = {
      id: 'task_math',
      subjectId: 'sub_math',
      title: 'Linear Algebra Review',
      type: 'revision',
      dueDate: '2026-10-15',
      estimatedMinutes: 60,
      difficulty: 3,
      status: 'pending',
    }

    const csTask: Task = {
      id: 'task_cs',
      subjectId: 'sub_cs',
      title: 'Trees Review',
      type: 'revision',
      dueDate: '2026-10-15',
      estimatedMinutes: 60,
      difficulty: 3,
      status: 'pending',
    }

    const ranked = rankPriorities({
      tasks: [csTask, mathTask],
      exams: [],
      subjects: mockSubjects,
      assessments,
      currentDate: today,
    })

    // Math should rank above CS due to declining marks
    expect(ranked[0].id).toBe('task_math')
    expect(ranked[0].reasons.some((r) => r.includes('Recent marks dropped'))).toBe(true)
  })

  it('handles missing data safely without crashing', () => {
    const taskWithoutDeadline: Task = {
      id: 'task_nodes',
      subjectId: 'sub_cs',
      title: 'Read Chapter 3',
      type: 'reading',
      estimatedMinutes: 45,
      difficulty: 2,
      status: 'pending',
    }

    // No exams, no marks, no deadlines
    const ranked = rankPriorities({
      tasks: [taskWithoutDeadline],
      exams: [],
      subjects: mockSubjects,
      assessments: [],
    })

    expect(ranked.length).toBe(1)
    expect(ranked[0].score).toBeGreaterThan(0)
    expect(ranked[0].reasons.length).toBeGreaterThan(0)
  })

  it('calculates subject stats and trends accurately', () => {
    const assessments: Assessment[] = [
      {
        id: 'a1',
        subjectId: 'sub_math',
        title: 'Q1',
        type: 'quiz',
        score: 10,
        maxScore: 20,
        percentage: 50,
        date: '2026-10-01',
      },
      {
        id: 'a2',
        subjectId: 'sub_math',
        title: 'Q2',
        type: 'quiz',
        score: 18,
        maxScore: 20,
        percentage: 90,
        date: '2026-10-05',
      },
    ]

    const stats = calculateSubjectStats(mockSubjects, assessments)
    const mathStats = stats.find((s) => s.subjectId === 'sub_math')

    expect(mathStats?.averagePercentage).toBe(70)
    expect(mathStats?.trend).toBe('improving')
  })
})
