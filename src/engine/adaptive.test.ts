import { describe, it, expect } from 'vitest'
import { calculateSubjectPacing, generateWeeklyPlan } from './adaptive'
import type { Subject, StudySession, Task } from '../types'

describe('Adaptive Pacing Engine', () => {
  const mockSubject: Subject = {
    id: 'sub_algo',
    name: 'Algorithms',
    color: '#3b82f6',
    targetGrade: 85,
  }

  it('learns a higher multiplier when sessions take longer than planned', () => {
    // 2 sessions: planned 60m, actual 90m (ratio 1.5x)
    const sessions: StudySession[] = [
      {
        id: 's1',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 90,
        status: 'completed',
        difficulty: 4,
        date: '2026-10-01',
      },
      {
        id: 's2',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 90,
        status: 'completed',
        difficulty: 4,
        date: '2026-10-02',
      },
    ]

    const pacing = calculateSubjectPacing([mockSubject], sessions)
    const algoPacing = pacing.find((p) => p.subjectId === 'sub_algo')

    expect(algoPacing?.multiplier).toBe(1.5)
    expect(algoPacing?.insight).toContain('take ~50% longer')
  })

  it('learns a lower multiplier when student finishes faster than planned', () => {
    // 2 sessions: planned 60m, actual 45m (ratio 0.75x)
    const sessions: StudySession[] = [
      {
        id: 's1',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 45,
        status: 'completed',
        difficulty: 2,
        date: '2026-10-01',
      },
      {
        id: 's2',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 45,
        status: 'completed',
        difficulty: 2,
        date: '2026-10-02',
      },
    ]

    const pacing = calculateSubjectPacing([mockSubject], sessions)
    const algoPacing = pacing.find((p) => p.subjectId === 'sub_algo')

    expect(algoPacing?.multiplier).toBe(0.75)
    expect(algoPacing?.insight).toContain('finish ~25% faster')
  })

  it('falls back to 1.0 when sample size is insufficient', () => {
    // only 1 session logged
    const sessions: StudySession[] = [
      {
        id: 's1',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 90,
        status: 'completed',
        difficulty: 3,
        date: '2026-10-01',
      },
    ]

    const pacing = calculateSubjectPacing([mockSubject], sessions)
    const algoPacing = pacing.find((p) => p.subjectId === 'sub_algo')

    expect(algoPacing?.multiplier).toBe(1.0)
    expect(algoPacing?.insight).toContain('Not enough session logs yet')
  })

  it('adjusts scheduled study minutes in the weekly plan based on the learned multiplier', () => {
    // student takes 1.5x longer on Algorithms
    const sessions: StudySession[] = [
      {
        id: 's1',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 90,
        status: 'completed',
        difficulty: 4,
        date: '2026-10-01',
      },
      {
        id: 's2',
        subjectId: 'sub_algo',
        plannedMinutes: 60,
        actualMinutes: 90,
        status: 'completed',
        difficulty: 4,
        date: '2026-10-02',
      },
    ]

    const task: Task = {
      id: 'task_dyn',
      subjectId: 'sub_algo',
      title: 'Dynamic Programming Practice',
      type: 'assignment',
      estimatedMinutes: 60,
      difficulty: 4,
      status: 'pending',
    }

    const plan = generateWeeklyPlan({
      tasks: [task],
      exams: [],
      subjects: [mockSubject],
      assessments: [],
      sessions,
      weeklyAvailableHours: 21,
      startDate: '2026-10-10',
    })

    expect(plan.length).toBeGreaterThan(0)
    const block = plan.find((b) => b.taskId === 'task_dyn')
    expect(block?.originalMinutes).toBe(60)
    // 60m * 1.5 = 90m
    expect(block?.plannedMinutes).toBe(90)
    expect(block?.reason).toContain('adjusted +50%')
  })
})
