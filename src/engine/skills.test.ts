import { describe, it, expect } from 'vitest'
import { analyzeSkillGaps, REFERENCE_CAREER_PATHS } from './skills'

describe('Skill Gap Navigator Engine', () => {
  const dataScientistPath = REFERENCE_CAREER_PATHS.find((p) => p.id === 'data-scientist')!

  it('correctly categorizes skills by completion status', () => {
    // Python is completed (req: 85, user: 90)
    // SQL is in progress (req: 75, user: 50)
    // Deep Learning is missing (req: 65, user: 10)
    const userRatings = {
      'Python Programming': 90,
      'SQL & Data Modeling': 50,
      'Deep Learning': 10,
    }

    const analysis = analyzeSkillGaps(dataScientistPath, userRatings)

    const python = analysis.evaluatedSkills.find((s) => s.name === 'Python Programming')
    const sql = analysis.evaluatedSkills.find((s) => s.name === 'SQL & Data Modeling')
    const dl = analysis.evaluatedSkills.find((s) => s.name === 'Deep Learning')

    expect(python?.status).toBe('completed')
    expect(python?.gap).toBe(0)

    expect(sql?.status).toBe('in_progress')
    expect(sql?.gap).toBe(25)

    expect(dl?.status).toBe('missing')
    expect(dl?.gap).toBe(55)
  })

  it('recommends foundational stage 1/2 skills with high gaps first', () => {
    // Python is not rated (0%), so it's a huge foundational gap
    const analysis = analyzeSkillGaps(dataScientistPath, {})

    expect(analysis.nextRecommendedSkill).not.toBeNull()
    // Stage 1 Python should be prioritized over later stage skills
    expect(analysis.nextRecommendedSkill?.name).toBe('Python Programming')
    expect(analysis.nextRecommendedSkill?.reasons.some((r) => r.includes('Stage 1'))).toBe(true)
  })

  it('computes overall role match percentage', () => {
    // all skills at 0%
    const emptyAnalysis = analyzeSkillGaps(dataScientistPath, {})
    expect(emptyAnalysis.overallMatchPercentage).toBe(0)

    // all skills met
    const fullRatings: Record<string, number> = {}
    dataScientistPath.skills.forEach((s) => {
      fullRatings[s.name] = s.requiredLevel
    })
    const fullAnalysis = analyzeSkillGaps(dataScientistPath, fullRatings)
    expect(fullAnalysis.overallMatchPercentage).toBe(100)
    expect(fullAnalysis.completedCount).toBe(dataScientistPath.skills.length)
  })
})
