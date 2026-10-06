// reference benchmark career tracks for students
export interface ReferenceSkill {
  name: string
  requiredLevel: number // 0 to 100
  weight: number // 1 to 5 importance
  stage: number // 1 to 5 staged roadmap
  description: string
}

export interface CareerPath {
  id: string
  title: string
  description: string
  skills: ReferenceSkill[]
}

export const REFERENCE_CAREER_PATHS: CareerPath[] = [
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: 'Build predictive models and extract insights from complex datasets.',
    skills: [
      { name: 'Python Programming', requiredLevel: 85, weight: 5, stage: 1, description: 'Core syntax, OOP, NumPy, pandas' },
      { name: 'SQL & Data Modeling', requiredLevel: 75, weight: 4, stage: 2, description: 'Joins, aggregations, window functions' },
      { name: 'Probability & Statistics', requiredLevel: 80, weight: 5, stage: 2, description: 'Hypothesis testing, distributions, regression' },
      { name: 'Machine Learning Fundamentals', requiredLevel: 80, weight: 5, stage: 3, description: 'Scikit-learn, classification, trees, clustering' },
      { name: 'Deep Learning', requiredLevel: 65, weight: 3, stage: 4, description: 'Neural networks, PyTorch/TensorFlow basics' },
      { name: 'Model Deployment & APIs', requiredLevel: 60, weight: 3, stage: 5, description: 'FastAPI, Docker, model serving' },
    ],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description: 'Transform raw business data into actionable reports and dashboards.',
    skills: [
      { name: 'Excel & Spreadsheets', requiredLevel: 85, weight: 4, stage: 1, description: 'Pivot tables, VLOOKUP/XLOOKUP, formulas' },
      { name: 'SQL Querying', requiredLevel: 85, weight: 5, stage: 1, description: 'Complex queries, filtering, reporting' },
      { name: 'Business Statistics', requiredLevel: 70, weight: 4, stage: 2, description: 'Descriptive stats, trend analysis' },
      { name: 'BI Tools (Power BI / Tableau)', requiredLevel: 80, weight: 5, stage: 3, description: 'Interactive dashboard creation' },
      { name: 'Python for Analysis', requiredLevel: 70, weight: 3, stage: 4, description: 'Pandas, matplotlib, seaborn' },
    ],
  },
  {
    id: 'ml-engineer',
    title: 'Machine Learning Engineer',
    description: 'Design, build, and deploy production-grade ML pipelines.',
    skills: [
      { name: 'Python Programming', requiredLevel: 90, weight: 5, stage: 1, description: 'Clean code, packaging, performance' },
      { name: 'Data Structures & Algorithms', requiredLevel: 80, weight: 4, stage: 2, description: 'Time/space complexity, core algorithmic patterns' },
      { name: 'Machine Learning Systems', requiredLevel: 85, weight: 5, stage: 3, description: 'Feature engineering, validation, hyperparameter tuning' },
      { name: 'Deep Learning & Frameworks', requiredLevel: 85, weight: 5, stage: 4, description: 'PyTorch, transformers, CNNs/RNNs' },
      { name: 'MLOps & Deployment', requiredLevel: 80, weight: 5, stage: 5, description: 'CI/CD for ML, cloud inference, monitoring' },
    ],
  },
  {
    id: 'software-developer',
    title: 'Software Developer',
    description: 'Build reliable software systems, backend services, and applications.',
    skills: [
      { name: 'Core Language (Java / C++ / Python)', requiredLevel: 85, weight: 5, stage: 1, description: 'OOP, syntax, standard library' },
      { name: 'Data Structures & Algorithms', requiredLevel: 85, weight: 5, stage: 2, description: 'Trees, graphs, dynamic programming' },
      { name: 'Git & Version Control', requiredLevel: 75, weight: 3, stage: 2, description: 'Branches, pull requests, merge conflict resolution' },
      { name: 'Databases & SQL', requiredLevel: 75, weight: 4, stage: 3, description: 'Relational databases, indexing, schema design' },
      { name: 'System Design & APIs', requiredLevel: 70, weight: 4, stage: 4, description: 'REST APIs, caching, architecture basics' },
    ],
  },
  {
    id: 'web-developer',
    title: 'Web Developer',
    description: 'Build modern responsive web applications across client and server.',
    skills: [
      { name: 'HTML, CSS & Tailwind', requiredLevel: 85, weight: 4, stage: 1, description: 'Layouts, flexbox, grid, responsive design' },
      { name: 'JavaScript & TypeScript', requiredLevel: 90, weight: 5, stage: 2, description: 'Async JS, ES6+, static typing' },
      { name: 'React & Frontend Frameworks', requiredLevel: 85, weight: 5, stage: 3, description: 'Components, state, hooks, routing' },
      { name: 'Node.js & Backend APIs', requiredLevel: 80, weight: 4, stage: 4, description: 'Express, REST endpoints, middleware' },
      { name: 'Databases & Auth', requiredLevel: 75, weight: 4, stage: 5, description: 'Postgres/MongoDB, JWT, session handling' },
    ],
  },
  {
    id: 'business-analyst',
    title: 'Business Analyst',
    description: 'Bridge business needs with technical solutions and project roadmaps.',
    skills: [
      { name: 'Requirements & Communication', requiredLevel: 85, weight: 5, stage: 1, description: 'User stories, stakeholder presentations' },
      { name: 'Excel & Financial Modeling', requiredLevel: 85, weight: 5, stage: 2, description: 'Cost-benefit analysis, forecasting' },
      { name: 'SQL for Business Queries', requiredLevel: 75, weight: 4, stage: 3, description: 'Extracting operational business data' },
      { name: 'Process Flow & Diagramming', requiredLevel: 75, weight: 4, stage: 4, description: 'UML, BPMN, workflow diagrams' },
      { name: 'Agile & Scrum Practices', requiredLevel: 70, weight: 3, stage: 5, description: 'Sprint planning, backlog refinement' },
    ],
  },
]

export interface EvaluatedSkill {
  name: string
  requiredLevel: number
  currentLevel: number
  gap: number
  weight: number
  stage: number
  description: string
  status: 'completed' | 'in_progress' | 'missing'
  priorityScore: number
  reasons: string[]
}

export interface SkillGapAnalysis {
  careerPathTitle: string
  evaluatedSkills: EvaluatedSkill[]
  completedCount: number
  inProgressCount: number
  missingCount: number
  nextRecommendedSkill: EvaluatedSkill | null
  overallMatchPercentage: number
}

// compute skill gap rankings and staged roadmap for a career path
export function analyzeSkillGaps(
  careerPath: CareerPath,
  userRatings: Record<string, number> // skillName -> 0..100
): SkillGapAnalysis {
  let totalMatchPct = 0

  const evaluated: EvaluatedSkill[] = careerPath.skills.map((skill) => {
    const current = Math.max(0, Math.min(100, userRatings[skill.name] ?? 0))
    const gap = Math.max(0, skill.requiredLevel - current)
    const match = Math.min(100, Math.round((current / skill.requiredLevel) * 100))
    totalMatchPct += match

    let status: EvaluatedSkill['status'] = 'missing'
    if (current >= skill.requiredLevel) {
      status = 'completed'
    } else if (current >= skill.requiredLevel * 0.4) {
      status = 'in_progress'
    }

    const reasons: string[] = []

    if (gap === 0) {
      reasons.push('Meets or exceeds career benchmark level')
    } else {
      if (gap >= 40) {
        reasons.push(`Large gap: ${gap}% below required level of ${skill.requiredLevel}%`)
      } else {
        reasons.push(`Minor gap: only ${gap}% away from required target`)
      }

      if (skill.stage === 1) {
        reasons.push('Foundational Stage 1 prerequisite')
      } else if (skill.weight === 5) {
        reasons.push('High importance benchmark (5/5 weight)')
      }
    }

    // rank priority: high gap * weight + boost for earlier stages
    const stageBoost = (6 - skill.stage) * 15
    const priorityScore = gap > 0 ? gap * (skill.weight / 5) + stageBoost : 0

    return {
      name: skill.name,
      requiredLevel: skill.requiredLevel,
      currentLevel: current,
      gap,
      weight: skill.weight,
      stage: skill.stage,
      description: skill.description,
      status,
      priorityScore: Math.round(priorityScore),
      reasons,
    }
  })

  // sort uncompleted skills by priority score descending
  const uncompleted = evaluated
    .filter((s) => s.status !== 'completed')
    .sort((a, b) => b.priorityScore - a.priorityScore)

  const nextRecommended = uncompleted.length > 0 ? uncompleted[0] : null
  const overallMatch = Math.round(totalMatchPct / (careerPath.skills.length || 1))

  return {
    careerPathTitle: careerPath.title,
    evaluatedSkills: evaluated,
    completedCount: evaluated.filter((s) => s.status === 'completed').length,
    inProgressCount: evaluated.filter((s) => s.status === 'in_progress').length,
    missingCount: evaluated.filter((s) => s.status === 'missing').length,
    nextRecommendedSkill: nextRecommended,
    overallMatchPercentage: overallMatch,
  }
}
