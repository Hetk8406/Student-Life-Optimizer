import type { AppData } from '../types'

const STORAGE_KEY = 'student_life_optimizer_data'

export const defaultData: AppData = {
  profile: {
    name: '',
    degree: '',
    university: '',
    semester: 1,
    dailyStudyHoursTarget: 3,
    weeklyAvailableHours: 20,
    careerGoal: '',
    onboardingCompleted: false,
  },
  subjects: [],
  exams: [],
  tasks: [],
  assessments: [],
  sessions: [],
  skills: [],
  careerGoals: [],
  goals: [],
}

// read data from localstorage or return defaults
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed }
  } catch (err) {
    console.error('Failed to load data from localStorage', err)
    return defaultData
  }
}

// save everything under one key
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to save data to localStorage', err)
  }
}

// download data as a JSON file
export function exportToJson(data: AppData) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `student-life-optimizer-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// parse and validate imported json
export function importFromJson(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON format')
  }

  // ensure all required keys exist
  const merged: AppData = {
    profile: { ...defaultData.profile, ...parsed.profile },
    subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
    exams: Array.isArray(parsed.exams) ? parsed.exams : [],
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    careerGoals: Array.isArray(parsed.careerGoals) ? parsed.careerGoals : [],
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
  }

  saveData(merged)
  return merged
}
