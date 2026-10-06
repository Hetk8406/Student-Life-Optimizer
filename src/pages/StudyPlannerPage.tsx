import { useState, useEffect } from 'react'
import { loadData, saveData } from '../storage'
import type { AppData, Task, StudySession } from '../types'
import {
  generateWeeklyPlan,
  calculateSubjectPacing,
  type WeeklyStudyBlock,
} from '../engine/adaptive'
import { EmptyState } from '../components/EmptyState'
import { useConfirm, useToast } from '../components/FeedbackContext'
import {
  CalendarCheck,
  Plus,
  Trash2,
  Pencil,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Sliders,
  CheckCircle2,
  ListTodo,
  History,
} from 'lucide-react'

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Very Easy', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  2: { label: 'Easy', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
  3: { label: 'Moderate', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
  4: { label: 'Challenging', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  5: { label: 'Difficult', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
}

export function StudyPlannerPage() {
  useEffect(() => {
    document.title = 'Study Planner | Student Life Optimizer'
  }, [])

  const confirm = useConfirm()
  const toast = useToast()

  const [data, setData] = useState<AppData>(() => loadData())
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks' | 'history'>('schedule')

  // task form state
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskSubjectId, setTaskSubjectId] = useState(data.subjects[0]?.id || '')
  const [taskType, setTaskType] = useState<Task['type']>('assignment')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskEstMins, setTaskEstMins] = useState(60)
  const [taskDifficulty, setTaskDifficulty] = useState(3)
  const [taskFormError, setTaskFormError] = useState('')

  // log session modal state
  const [loggingBlock, setLoggingBlock] = useState<WeeklyStudyBlock | null>(null)
  const [logStatus, setLogStatus] = useState<StudySession['status']>('completed')
  const [logPlannedMins, setLogPlannedMins] = useState(60)
  const [logActualMins, setLogActualMins] = useState(60)
  const [logDifficulty, setLogDifficulty] = useState(3)
  const [logNotes, setLogNotes] = useState('')

  // run engine calculations
  const weeklyPlan = generateWeeklyPlan({
    tasks: data.tasks,
    exams: data.exams,
    subjects: data.subjects,
    assessments: data.assessments,
    sessions: data.sessions,
    weeklyAvailableHours: data.profile.weeklyAvailableHours || 20,
  })

  const pacingCorrections = calculateSubjectPacing(data.subjects, data.sessions)

  // group weekly plan blocks by day label
  const daysMap = new Map<string, WeeklyStudyBlock[]>()
  for (const block of weeklyPlan) {
    const list = daysMap.get(block.dayLabel) || []
    list.push(block)
    daysMap.set(block.dayLabel, list)
  }

  // reset task form
  const resetTaskForm = () => {
    setShowAddTaskForm(false)
    setEditingTaskId(null)
    setTaskTitle('')
    setTaskDueDate('')
    setTaskEstMins(60)
    setTaskDifficulty(3)
    setTaskType('assignment')
    setTaskFormError('')
  }

  // open task edit
  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setTaskTitle(task.title)
    setTaskSubjectId(task.subjectId)
    setTaskType(task.type)
    setTaskDueDate(task.dueDate || '')
    setTaskEstMins(task.estimatedMinutes)
    setTaskDifficulty(task.difficulty || 3)
    setShowAddTaskForm(true)
    setTaskFormError('')
    setActiveTab('tasks')
  }

  // save task (add or edit)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim()) {
      setTaskFormError('Please enter a task title.')
      return
    }
    if (!taskSubjectId) {
      setTaskFormError('Please select a subject.')
      return
    }
    if (!taskEstMins || taskEstMins <= 0) {
      setTaskFormError('Estimated duration must be greater than 0 minutes.')
      return
    }

    let updatedTasks: Task[]
    if (editingTaskId) {
      updatedTasks = data.tasks.map((t) =>
        t.id === editingTaskId
          ? {
              ...t,
              title: taskTitle.trim(),
              subjectId: taskSubjectId,
              type: taskType,
              dueDate: taskDueDate || undefined,
              estimatedMinutes: Number(taskEstMins),
              difficulty: Number(taskDifficulty),
            }
          : t
      )
    } else {
      const newTask: Task = {
        id: 'task_' + Date.now(),
        title: taskTitle.trim(),
        subjectId: taskSubjectId,
        type: taskType,
        dueDate: taskDueDate || undefined,
        estimatedMinutes: Number(taskEstMins),
        difficulty: Number(taskDifficulty),
        status: 'pending',
      }
      updatedTasks = [...data.tasks, newTask]
    }

    const updatedData: AppData = { ...data, tasks: updatedTasks }
    setData(updatedData)
    saveData(updatedData)
    resetTaskForm()
  }

  // toggle task status
  const handleToggleTaskStatus = (id: string) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id !== id) return t
      const nextStatus: Task['status'] = t.status === 'completed' ? 'pending' : 'completed'
      return { ...t, status: nextStatus }
    })
    const updatedData = { ...data, tasks: updatedTasks }
    setData(updatedData)
    saveData(updatedData)
  }

  // delete task
  const handleDeleteTask = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete task "${title}"?`,
      confirmText: 'Delete Task',
      isDestructive: true,
    })
    if (!confirmed) return

    const updatedData = {
      ...data,
      tasks: data.tasks.filter((t) => t.id !== id),
    }
    setData(updatedData)
    saveData(updatedData)
    toast.success(`Task "${title}" deleted`)
  }

  // open log session dialog for a block
  const handleOpenLogModal = (block: WeeklyStudyBlock) => {
    setLoggingBlock(block)
    setLogPlannedMins(block.plannedMinutes)
    setLogActualMins(block.plannedMinutes)
    setLogStatus('completed')
    setLogDifficulty(3)
    setLogNotes('')
  }

  // submit session log
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loggingBlock) return

    const newSession: StudySession = {
      id: 'sess_' + Date.now(),
      taskId: loggingBlock.taskId,
      subjectId: loggingBlock.subjectId,
      plannedMinutes: Number(logPlannedMins) || loggingBlock.plannedMinutes,
      actualMinutes: Number(logActualMins) || loggingBlock.plannedMinutes,
      status: logStatus,
      difficulty: Number(logDifficulty) || 3,
      notes: logNotes.trim() || undefined,
      date: loggingBlock.date,
    }

    // if session completed and linked to a task, mark task completed
    let updatedTasks = data.tasks
    if (loggingBlock.taskId && logStatus === 'completed') {
      updatedTasks = data.tasks.map((t) =>
        t.id === loggingBlock.taskId ? { ...t, status: 'completed' as const } : t
      )
    }

    const updatedData: AppData = {
      ...data,
      tasks: updatedTasks,
      sessions: [newSession, ...data.sessions],
    }

    setData(updatedData)
    saveData(updatedData)
    setLoggingBlock(null)
  }

  // delete a past session log
  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Delete Study Session',
      message: 'Are you sure you want to delete this logged study session?',
      confirmText: 'Delete Session',
      isDestructive: true,
    })
    if (!confirmed) return

    const updated = {
      ...data,
      sessions: data.sessions.filter((s) => s.id !== sessionId),
    }
    setData(updated)
    saveData(updated)
    toast.success('Study session deleted')
  }

  // empty subjects guard
  if (data.subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Study Planner</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate your weekly schedule and track actual study time.
          </p>
        </div>
        <EmptyState
          icon={CalendarCheck}
          title="No subjects enrolled"
          description="Add your enrolled subjects in your profile before generating study plans."
          actionLabel="Add Subjects in Profile"
          actionLink="/profile"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Smart Study Planner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Weekly priority schedule powered by adaptive pacing and your available hours budget.
          </p>
        </div>

        <button
          onClick={() => {
            resetTaskForm()
            setTaskSubjectId(data.subjects[0]?.id || '')
            setShowAddTaskForm(true)
            setActiveTab('tasks')
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors self-start"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'schedule'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Weekly Schedule ({weeklyPlan.length} blocks)
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'tasks'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" /> Task Backlog ({data.tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'history'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Session Logs ({data.sessions.length})
        </button>
      </div>

      {/* TAB 1: WEEKLY SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* LEARNED ADAPTIVE CORRECTIONS BANNER */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Learned Adaptive Pacing</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {pacingCorrections.map((p) => (
                <div
                  key={p.subjectId}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{p.subjectName}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.insight}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      p.multiplier > 1.1
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        : p.multiplier < 0.9
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {p.multiplier}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SCHEDULE BLOCKS GROUPED BY DAY */}
          {weeklyPlan.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No study items in your queue"
              description="Add upcoming exams or assignment tasks to generate your automated 7-day schedule."
              actionLabel="Add Your First Task"
              onAction={() => {
                resetTaskForm()
                setTaskSubjectId(data.subjects[0]?.id || '')
                setShowAddTaskForm(true)
                setActiveTab('tasks')
              }}
            />
          ) : (
            <div className="space-y-5">
              {Array.from(daysMap.entries()).map(([dayLabel, blocks]) => {
                const totalDayMins = blocks.reduce((acc, b) => acc + b.plannedMinutes, 0)

                return (
                  <div
                    key={dayLabel}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {dayLabel}
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Planned: {totalDayMins} min (~{(totalDayMins / 60).toFixed(1)}h)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {blocks.map((block) => (
                        <div
                          key={block.id}
                          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                            block.isLogged
                              ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                style={{
                                  backgroundColor: `${block.subjectColor}20`,
                                  color: block.subjectColor,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: block.subjectColor }}
                                />
                                {block.subjectName}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3" /> {block.plannedMinutes} min
                                {block.plannedMinutes !== block.originalMinutes && (
                                  <span className="text-[10px] text-slate-400">
                                    (base: {block.originalMinutes}m)
                                  </span>
                                )}
                              </span>

                              {block.isLogged && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" /> Logged
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {block.title}
                            </h4>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {block.reason}
                            </p>
                          </div>

                          <div className="self-end sm:self-center shrink-0">
                            {block.isLogged ? (
                              <span className="text-xs text-slate-400 italic">Session recorded</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenLogModal(block)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                              >
                                Log Session
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASK BACKLOG (LIST + ADD FORM) */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* ADD / EDIT TASK FORM */}
          {showAddTaskForm && (
            <form onSubmit={handleSaveTask} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingTaskId ? 'Edit Task' : 'Create New Study Task'}
                </h2>
                <button type="button" onClick={resetTaskForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {taskFormError && (
                <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {taskFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Chapter 4 Practice Problems"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={taskSubjectId}
                    onChange={(e) => setTaskSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {data.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id} className="dark:bg-slate-900">
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Type
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as Task['type'])}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="assignment" className="dark:bg-slate-900">Assignment</option>
                    <option value="exam_prep" className="dark:bg-slate-900">Exam Prep</option>
                    <option value="revision" className="dark:bg-slate-900">Revision</option>
                    <option value="reading" className="dark:bg-slate-900">Reading</option>
                    <option value="project" className="dark:bg-slate-900">Project Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Minutes <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={15}
                    min={15}
                    max={480}
                    value={taskEstMins}
                    onChange={(e) => setTaskEstMins(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={taskDifficulty}
                    onChange={(e) => setTaskDifficulty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value={1} className="dark:bg-slate-900">1 - Very Easy</option>
                    <option value={2} className="dark:bg-slate-900">2 - Easy</option>
                    <option value={3} className="dark:bg-slate-900">3 - Moderate</option>
                    <option value={4} className="dark:bg-slate-900">4 - Challenging</option>
                    <option value={5} className="dark:bg-slate-900">5 - Difficult</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetTaskForm}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-800"
                >
                  {editingTaskId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          )}

          {/* FILTER BUTTONS */}
          {data.tasks.length > 0 && (
            <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              {(['all', 'pending', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTaskFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    taskFilter === tab
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab} (
                  {tab === 'all'
                    ? data.tasks.length
                    : tab === 'pending'
                    ? data.tasks.filter((t) => t.status !== 'completed').length
                    : data.tasks.filter((t) => t.status === 'completed').length}
                  )
                </button>
              ))}
            </div>
          )}

          {/* TASK LIST */}
          <div className="space-y-2.5">
            {data.tasks
              .filter((t) => {
                if (taskFilter === 'pending') return t.status !== 'completed'
                if (taskFilter === 'completed') return t.status === 'completed'
                return true
              })
              .map((task) => {
                const subject = data.subjects.find((s) => s.id === task.subjectId)
                const isCompleted = task.status === 'completed'
                const diffInfo = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS[3]

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleTaskStatus(task.id)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer shrink-0"
                      />

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${subject?.color || '#64748b'}20`,
                              color: subject?.color || '#64748b',
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject?.color }} />
                            {subject?.name || 'Subject'}
                          </span>

                          <span className="text-[11px] text-slate-500 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {task.type.replace('_', ' ')}
                          </span>

                          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${diffInfo.color}`}>
                            {diffInfo.label}
                          </span>
                        </div>

                        <h4
                          className={`text-sm font-medium leading-snug truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.estimatedMinutes} min
                          </span>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Due {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        title="Edit task"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* TAB 3: SESSION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Logged Study Sessions ({data.sessions.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historical records of planned vs actual minutes used to calibrate adaptive time estimates.
              </p>
            </div>
          </div>

          {data.sessions.length === 0 ? (
            <EmptyState
              icon={History}
              title="No study sessions logged yet"
              description="When you complete study blocks from the Weekly Schedule, log them here to teach the system how fast you study."
              actionLabel="Go to Weekly Schedule"
              onAction={() => setActiveTab('schedule')}
            />
          ) : (
            <div className="space-y-2.5">
              {data.sessions.map((sess) => {
                const subject = data.subjects.find((s) => s.id === sess.subjectId)
                const diffMins = sess.actualMinutes - sess.plannedMinutes
                const diffPct = Math.round((diffMins / (sess.plannedMinutes || 1)) * 100)

                return (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: `${subject?.color || '#64748b'}20`,
                            color: subject?.color || '#64748b',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject?.color }} />
                          {subject?.name || 'General'}
                        </span>

                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold capitalize ${
                            sess.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : sess.status === 'partial'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {sess.status}
                        </span>

                        <span className="text-slate-400">{sess.date}</span>
                      </div>

                      {sess.notes && (
                        <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">"{sess.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {sess.actualMinutes} min actual
                          </span>{' '}
                          <span className="text-slate-400">({sess.plannedMinutes}m planned)</span>
                        </div>
                        <div
                          className={`text-[11px] font-medium ${
                            diffMins > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : diffMins < 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {diffMins > 0 ? `+${diffMins}m (${diffPct}% slower)` : diffMins < 0 ? `${diffMins}m (${Math.abs(diffPct)}% faster)` : 'Exact match'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete session log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* LOG SESSION MODAL / DIALOG */}
      {loggingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleSaveSession}
            className="w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Log Study Session</h3>
                <p className="text-xs text-slate-500">{loggingBlock.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setLoggingBlock(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['completed', 'partial', 'skipped'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLogStatus(st)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                        logStatus === st
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Planned Minutes
                  </label>
                  <input
                    type="number"
                    value={logPlannedMins}
                    onChange={(e) => setLogPlannedMins(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Minutes Spent <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={logActualMins}
                    onChange={(e) => setLogActualMins(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Perceived Difficulty
                </label>
                <select
                  value={logDifficulty}
                  onChange={(e) => setLogDifficulty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                >
                  <option value={1} className="dark:bg-slate-900">1 - Very Easy</option>
                  <option value={2} className="dark:bg-slate-900">2 - Easy</option>
                  <option value={3} className="dark:bg-slate-900">3 - Moderate</option>
                  <option value={4} className="dark:bg-slate-900">4 - Challenging</option>
                  <option value={5} className="dark:bg-slate-900">5 - Very Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Got stuck on recursion problem 3"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLoggingBlock(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800"
              >
                Save & Update Pacing
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
