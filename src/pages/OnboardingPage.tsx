import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { loadData, saveData } from '../storage'
import type { Subject } from '../types'
import { ArrowRight, ArrowLeft, Plus, Trash2, Check } from 'lucide-react'

// preset colors for subjects
const SUBJECT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // slate
]

const CAREER_SUGGESTIONS = [
  'Software Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Web Developer',
  'Business / Data Analyst',
  'Cybersecurity Analyst',
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [initialData] = useState<ReturnType<typeof loadData>>(() => loadData())

  useEffect(() => {
    document.title = 'Onboarding | Student Life Optimizer'
  }, [])

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // step 1 state
  const [name, setName] = useState(initialData.profile.name || '')
  const [degree, setDegree] = useState(initialData.profile.degree || '')
  const [university, setUniversity] = useState(initialData.profile.university || '')
  const [semester, setSemester] = useState(initialData.profile.semester || 1)

  // step 2 state: subjects
  const [subjects, setSubjects] = useState<Subject[]>(initialData.subjects || [])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0])

  // step 3 state
  const [careerGoal, setCareerGoal] = useState(initialData.profile.careerGoal || 'Software Developer')
  const [weeklyHours, setWeeklyHours] = useState(initialData.profile.weeklyAvailableHours || 20)

  // if onboarding is already completed, go straight to dashboard
  if (initialData.profile.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />
  }

  // step 1 validation
  const canGoToStep2 = degree.trim().length > 0

  // step 2 validation
  const canGoToStep3 = subjects.length > 0

  // add a subject
  const handleAddSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newSubjectName.trim()
    if (!trimmed) return

    const newSub: Subject = {
      id: 'sub_' + Date.now(),
      name: trimmed,
      color: newSubjectColor,
      targetGrade: 80,
    }

    setSubjects([...subjects, newSub])
    setNewSubjectName('')
    // cycle to next color
    const nextColorIndex = (SUBJECT_COLORS.indexOf(newSubjectColor) + 1) % SUBJECT_COLORS.length
    setNewSubjectColor(SUBJECT_COLORS[nextColorIndex])
  }

  // remove a subject
  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id))
  }

  // finish onboarding and persist
  const handleFinish = () => {
    const dailyTarget = Number((weeklyHours / 7).toFixed(1))

    const updatedData = {
      ...initialData,
      profile: {
        ...initialData.profile,
        name: name.trim() || 'Student',
        degree: degree.trim(),
        university: university.trim(),
        semester: Number(semester) || 1,
        weeklyAvailableHours: Number(weeklyHours) || 20,
        dailyStudyHoursTarget: dailyTarget,
        careerGoal: careerGoal.trim(),
        onboardingCompleted: true,
      },
      subjects,
    }

    saveData(updatedData)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto">
        {/* progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Step {step} of 3</span>
            <span>
              {step === 1 && 'Academic Profile'}
              {step === 2 && 'Semester Subjects'}
              {step === 3 && 'Career & Study Budget'}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 dark:bg-slate-100 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/* STEP 1: DEGREE + SEMESTER */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">What are you studying?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This sets up your academic baseline.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Degree / Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Engineering or B.S. Data Science"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. State University"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Semester / Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  disabled={!canGoToStep2}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Next: Add Subjects <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SUBJECTS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Current Semester Subjects</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add the subjects you are taking right now. Add at least 1 to continue.
                </p>
              </div>

              {/* add subject form */}
              <form onSubmit={handleAddSubject} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics, Operating Systems, Machine Learning"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />

                {/* color picker buttons */}
                <div className="flex gap-1">
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubjectColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newSubjectColor === c ? 'scale-110 ring-2 ring-slate-400' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: c }}
                      title="Select color"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newSubjectName.trim()}
                  className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* list of added subjects */}
              <div className="space-y-2 min-h-[100px]">
                {subjects.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    No subjects added yet. Type a subject name above and click add.
                  </div>
                ) : (
                  subjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="font-medium text-xs sm:text-sm">{sub.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  disabled={!canGoToStep3}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Next: Career & Hours <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CAREER GOAL + WEEKLY HOURS */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Career Goal & Study Time</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect your daily effort to your future goals without unrealistic schedules.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Career Role
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CAREER_SUGGESTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setCareerGoal(role)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        careerGoal === role
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent font-medium'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="Or enter a custom career target"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Weekly Available Study Hours
                  </label>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {weeklyHours} hrs/week (~{(weeklyHours / 7).toFixed(1)} hrs/day)
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-slate-900 dark:accent-slate-100 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>5 hrs (light)</span>
                  <span>20 hrs (standard)</span>
                  <span>40+ hrs (intensive)</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  <Check className="w-4 h-4" /> Finish & Open Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
