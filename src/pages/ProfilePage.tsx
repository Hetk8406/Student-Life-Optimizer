import { useState, useEffect } from 'react'
import { loadData, saveData, exportToJson, importFromJson, defaultData } from '../storage'
import { useConfirm, useToast } from '../components/FeedbackContext'
import type { AppData, Subject } from '../types'
import { Check, Plus, Trash2, Download, Upload, RotateCcw } from 'lucide-react'

const SUBJECT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // slate
]

export function ProfilePage() {
  useEffect(() => {
    document.title = 'Profile & Settings | Student Life Optimizer'
  }, [])

  const confirm = useConfirm()
  const toast = useToast()

  const [data, setData] = useState<AppData>(() => loadData())
  const [savedSuccess, setSavedSuccess] = useState(false)

  // new subject form state
  const [newSubName, setNewSubName] = useState('')
  const [newSubColor, setNewSubColor] = useState(SUBJECT_COLORS[0])
  const [newSubTarget, setNewSubTarget] = useState(80)

  // update top-level profile field
  const updateProfile = (field: keyof AppData['profile'], value: string | number | boolean) => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }))
    setSavedSuccess(false)
  }

  // update weekly study hours and sync daily target
  const handleWeeklyHoursChange = (hours: number) => {
    const daily = Number((hours / 7).toFixed(1))
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        weeklyAvailableHours: hours,
        dailyStudyHoursTarget: daily,
      },
    }))
    setSavedSuccess(false)
  }

  // add a new subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newSubName.trim()
    if (!name) return

    const newSub: Subject = {
      id: 'sub_' + Date.now(),
      name,
      color: newSubColor,
      targetGrade: Number(newSubTarget) || 80,
    }

    const updated = {
      ...data,
      subjects: [...data.subjects, newSub],
    }

    setData(updated)
    saveData(updated)
    setNewSubName('')
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  // delete a subject and cascade clean from exams, tasks, marks
  const handleDeleteSubject = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Delete subject "${name}"? This will permanently remove all associated exams, tasks, and marks for this subject.`,
      confirmText: 'Delete Subject',
      isDestructive: true,
    })
    if (!confirmed) return

    const updated: AppData = {
      ...data,
      subjects: data.subjects.filter((s) => s.id !== id),
      exams: data.exams.filter((e) => e.subjectId !== id),
      tasks: data.tasks.filter((t) => t.subjectId !== id),
      assessments: data.assessments.filter((a) => a.subjectId !== id),
    }

    setData(updated)
    saveData(updated)
    toast.success(`Subject "${name}" deleted`)
  }

  // save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    saveData(data)
    setSavedSuccess(true)
    toast.success('Profile settings saved')
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  // export json file
  const handleExport = () => {
    exportToJson(data)
    toast.success('Data exported to JSON')
  }

  // import json file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const confirmed = await confirm({
          title: 'Import Backup Data',
          message: 'Importing this backup will overwrite your current subjects, exams, tasks, and marks. Are you sure you want to proceed?',
          confirmText: 'Overwrite & Import',
          isDestructive: true,
        })
        if (!confirmed) {
          e.target.value = ''
          return
        }

        const imported = importFromJson(content)
        setData(imported)
        toast.success('Data imported successfully')
      } catch (err) {
        console.error('Import failed', err)
        toast.error('Could not import file: invalid JSON format.')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  // reset all data
  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset All Data',
      message: 'Are you sure you want to reset all data? This will permanently erase all subjects, exams, tasks, marks, and settings from your browser. This action cannot be undone.',
      confirmText: 'Wipe Everything & Reset',
      isDestructive: true,
    })
    if (!confirmed) return

    saveData(defaultData)
    setData(defaultData)
    toast.success('All data has been reset to defaults')
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div className="space-y-8 max-w-3xl pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Profile & Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your academic degree, semester subjects, study budget, and data backups.
        </p>
      </div>

      {/* SECTION 1: ACADEMIC PROFILE */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          Academic Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={data.profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              placeholder="e.g. Alex"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Degree / Program
            </label>
            <input
              type="text"
              value={data.profile.degree}
              onChange={(e) => updateProfile('degree', e.target.value)}
              placeholder="e.g. B.Tech Computer Engineering"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              University / College
            </label>
            <input
              type="text"
              value={data.profile.university}
              onChange={(e) => updateProfile('university', e.target.value)}
              placeholder="e.g. State University"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Semester
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={data.profile.semester || 1}
              onChange={(e) => updateProfile('semester', Number(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Career Role
            </label>
            <input
              type="text"
              value={data.profile.careerGoal}
              onChange={(e) => updateProfile('careerGoal', e.target.value)}
              placeholder="e.g. Data Scientist"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Weekly Available Study Hours
              </label>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {data.profile.weeklyAvailableHours || 20} hrs (~{data.profile.dailyStudyHoursTarget || 3} hrs/day)
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={80}
              step={1}
              value={data.profile.weeklyAvailableHours || 20}
              onChange={(e) => handleWeeklyHoursChange(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Saved
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* SECTION 2: SUBJECTS LIST & ADD FORM */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Enrolled Subjects ({data.subjects.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All exams, study tasks, and grade assessments link to these subjects.
          </p>
        </div>

        {/* add subject inline */}
        <form onSubmit={handleAddSubject} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <input
            type="text"
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            placeholder="New subject name (e.g. Distributed Systems)"
            className="flex-1 min-w-[200px] px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Color:</span>
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewSubColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  newSubColor === c ? 'scale-125 ring-2 ring-slate-400' : 'opacity-70'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Target %:</span>
            <input
              type="number"
              min={40}
              max={100}
              value={newSubTarget}
              onChange={(e) => setNewSubTarget(Number(e.target.value) || 80)}
              className="w-16 px-2 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={!newSubName.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        </form>

        {/* subjects list */}
        <div className="space-y-2">
          {data.subjects.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              No subjects added yet. Add at least one above.
            </div>
          ) : (
            data.subjects.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{sub.name}</span>
                  <span className="text-xs text-slate-400">Target: {sub.targetGrade}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(sub.id, sub.name)}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                  title="Delete subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 3: EXPORT / IMPORT / RESET */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Data Backup & Restore
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Since data lives in your browser's local storage, export a backup anytime to prevent accidental clearing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Data (JSON)
          </button>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Import Data (JSON)
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  )
}
