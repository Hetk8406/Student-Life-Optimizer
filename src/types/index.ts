// student profile info
export interface Profile {
  name: string
  degree: string
  university: string
  semester: number
  dailyStudyHoursTarget: number
  weeklyAvailableHours: number
  careerGoal: string
  onboardingCompleted: boolean
  primaryCareerGoalId?: string
}

// syllabus topic under a subject or exam
export interface Topic {
  id: string
  name: string
  weight: number // 1 to 5
  confidence: number // 1 to 5
  completed: boolean
}

// enrolled course
export interface Subject {
  id: string
  name: string
  code?: string
  color: string
  targetGrade: number
}

// upcoming exam with syllabus topics
export interface Exam {
  id: string
  subjectId: string
  title: string
  date: string // YYYY-MM-DD
  targetScore: number
  topics: Topic[]
  notes?: string
}

// study task or assignment
export interface Task {
  id: string
  subjectId: string
  examId?: string
  title: string
  type: 'assignment' | 'exam_prep' | 'revision' | 'reading' | 'project'
  dueDate?: string
  estimatedMinutes: number
  difficulty: number // 1 to 5
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

// quiz, assignment, or exam marks
export interface Assessment {
  id: string
  subjectId: string
  examId?: string
  title: string
  type: 'quiz' | 'assignment' | 'midterm' | 'final' | 'project'
  score: number
  maxScore: number
  percentage: number
  date: string
}

// logged study session (for adaptive pacing)
export interface StudySession {
  id: string
  taskId?: string
  subjectId: string
  plannedMinutes: number
  actualMinutes: number
  status: 'completed' | 'partial' | 'skipped'
  difficulty: number // 1 to 5
  notes?: string
  date: string
}

// student skill rating
export interface Skill {
  id: string
  name: string
  category: 'programming' | 'math' | 'data' | 'tools' | 'core_cs' | 'soft_skills'
  currentLevel: number // 1 to 5
  targetLevel?: number // 1 to 5
}

// career track with benchmark skills
export interface CareerGoalSkillRequirement {
  skillId: string
  requiredLevel: number
  weight: number
  stage: number
}

export interface CareerGoal {
  id: string
  title: string
  description: string
  requiredSkills: CareerGoalSkillRequirement[]
}

// student goal
export interface Goal {
  id: string
  title: string
  type: 'short_term' | 'long_term'
  targetDate?: string
  completed: boolean
  subjectId?: string
  careerGoalId?: string
}

// root state stored in localstorage
export interface AppData {
  profile: Profile
  subjects: Subject[]
  exams: Exam[]
  tasks: Task[]
  assessments: Assessment[]
  sessions: StudySession[]
  skills: Skill[]
  careerGoals: CareerGoal[]
  goals: Goal[]
}
