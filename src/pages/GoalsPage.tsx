import { useState, useEffect } from 'react'
import { loadData, saveData } from '../storage'
import type { AppData, Goal } from '../types'
import { REFERENCE_CAREER_PATHS } from '../engine/skills'
import { EmptyState } from '../components/EmptyState'
import { useConfirm, useToast } from '../components/FeedbackContext'
import {
  Flag,
  Plus,
  Trash2,
  Calendar,
  X,
  Briefcase,
  BookOpen,
} from 'lucide-react'

export function GoalsPage() {
  useEffect(() => {
    document.title = 'Goals | Student Life Optimizer'
  }, [])

  const confirm = useConfirm()
  const toast = useToast()

  const [data, setData] = useState<AppData>(() => loadData())
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'short_term' | 'long_term'>('all')

  // form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Goal['type']>('short_term')
  const [targetDate, setTargetDate] = useState('')
  const [relatedSubjectId, setRelatedSubjectId] = useState('')
  const [targetGrade, setTargetGrade] = useState<number | ''>('')
  const [relatedCareerGoal, setRelatedCareerGoal] = useState(data.profile.careerGoal || '')
  const [formError, setFormError] = useState('')

  const resetForm = () => {
    setShowAddForm(false)
    setTitle('')
    setType('short_term')
    setTargetDate('')
    setRelatedSubjectId('')
    setTargetGrade('')
    setRelatedCareerGoal(data.profile.careerGoal || '')
    setFormError('')
  }

  // save new goal and sync with profile / subjects
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setFormError('Please enter a goal title.')
      return
    }

    const newGoal: Goal = {
      id: 'goal_' + Date.now(),
      title: title.trim(),
      type,
      targetDate: targetDate || undefined,
      completed: false,
      subjectId: relatedSubjectId || undefined,
      careerGoalId: relatedCareerGoal || undefined,
    }

    let updatedSubjects = [...data.subjects]
    // if target score was specified for a subject, sync it to subject.targetGrade
    if (relatedSubjectId && targetGrade !== '') {
      updatedSubjects = updatedSubjects.map((s) =>
        s.id === relatedSubjectId ? { ...s, targetGrade: Number(targetGrade) } : s
      )
    }

    // if a career goal was linked, sync it to student profile
    let updatedProfile = { ...data.profile }
    if (relatedCareerGoal) {
      updatedProfile.careerGoal = relatedCareerGoal
    }

    const updatedData: AppData = {
      ...data,
      profile: updatedProfile,
      subjects: updatedSubjects,
      goals: [newGoal, ...data.goals],
    }

    setData(updatedData)
    saveData(updatedData)
    resetForm()
  }

  // toggle completed
  const handleToggleComplete = (goalId: string) => {
    const updatedGoals = data.goals.map((g) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g
    )
    const updatedData = { ...data, goals: updatedGoals }
    setData(updatedData)
    saveData(updatedData)
  }

  // delete goal
  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    const confirmed = await confirm({
      title: 'Delete Goal',
      message: `Are you sure you want to delete goal "${goalTitle}"?`,
      confirmText: 'Delete Goal',
      isDestructive: true,
    })
    if (!confirmed) return

    const updatedData = {
      ...data,
      goals: data.goals.filter((g) => g.id !== goalId),
    }
    setData(updatedData)
    saveData(updatedData)
    toast.success(`Goal "${goalTitle}" deleted`)
  }

  const filteredGoals = data.goals.filter((g) => {
    if (filter === 'short_term') return g.type === 'short_term'
    if (filter === 'long_term') return g.type === 'long_term'
    return true
  })

  return (
    <div className="space-y-6 pb-12">
      {/* top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Student Goals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set academic milestones and career goals that feed directly into the planner and skill gap navigator.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors self-start"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        )}
      </div>

      {/* ADD GOAL FORM */}
      {showAddForm && (
        <form onSubmit={handleSaveGoal} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Create New Goal</h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Goal Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Score >85% in Calculus or Become a Data Scientist"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Goal Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Goal['type'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
              >
                <option value="short_term" className="dark:bg-slate-900">Short-Term (Semester)</option>
                <option value="long_term" className="dark:bg-slate-900">Long-Term (Career/Degree)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link to Subject (Optional)
              </label>
              <select
                value={relatedSubjectId}
                onChange={(e) => setRelatedSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
              >
                <option value="" className="dark:bg-slate-900">None</option>
                {data.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="dark:bg-slate-900">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {relatedSubjectId ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Grade % (Feeds Planner)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 85"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Career Track (Feeds Skills)
                </label>
                <select
                  value={relatedCareerGoal}
                  onChange={(e) => setRelatedCareerGoal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                >
                  <option value="" className="dark:bg-slate-900">None</option>
                  {REFERENCE_CAREER_PATHS.map((path) => (
                    <option key={path.id} value={path.title} className="dark:bg-slate-900">
                      {path.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-800"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['all', 'short_term', 'long_term'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.replace('_', ' ')} (
            {tab === 'all'
              ? data.goals.length
              : data.goals.filter((g) => g.type === tab).length}
            )
          </button>
        ))}
      </div>

      {/* GOALS LIST */}
      {data.goals.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No goals created yet"
          description="Set short-term course milestones or long-term career goals to focus your daily study schedule."
          actionLabel="Create Your First Goal"
          onAction={() => setShowAddForm(true)}
        />
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No goals found in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const subject = data.subjects.find((s) => s.id === goal.subjectId)

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                  goal.completed
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => handleToggleComplete(goal.id)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer mt-1 shrink-0"
                  />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {goal.type === 'short_term' ? 'Short-Term' : 'Long-Term'}
                      </span>

                      {subject && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: `${subject.color}20`,
                            color: subject.color,
                          }}
                        >
                          <BookOpen className="w-3 h-3" /> {subject.name} (Target: {subject.targetGrade}%)
                        </span>
                      )}

                      {goal.careerGoalId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                          <Briefcase className="w-3 h-3" /> Career: {goal.careerGoalId}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-sm font-semibold leading-snug ${
                        goal.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {goal.title}
                    </h3>

                    {goal.targetDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" /> Target Date: {goal.targetDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
