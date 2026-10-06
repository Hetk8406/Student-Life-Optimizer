import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadData, saveData } from '../storage'
import type { AppData } from '../types'
import {
  rankPriorities,
  calculateSubjectStats,
  generateDashboardInsights,
  getDaysBetween,
} from '../engine/prioritization'
import { EmptyState } from '../components/EmptyState'
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Plus,
} from 'lucide-react'

export function DashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard | Student Life Optimizer'
  }, [])
  const [data, setData] = useState<AppData>(() => loadData())

  const hasSubjects = data.subjects.length > 0
  const hasItemsToRank = data.tasks.length > 0 || data.exams.length > 0

  // run engine calculations
  const rankedItems = rankPriorities({
    tasks: data.tasks,
    exams: data.exams,
    subjects: data.subjects,
    assessments: data.assessments,
    dailyStudyHoursTarget: data.profile.dailyStudyHoursTarget || 3,
  })

  const topPriorities = rankedItems.slice(0, 5)
  const subjectStats = calculateSubjectStats(data.subjects, data.assessments)
  const insights = generateDashboardInsights(subjectStats, rankedItems)

  // identify strongest and weakest subjects from assessed subjects
  const assessedSubjects = subjectStats
    .filter((s) => s.averagePercentage !== null)
    .sort((a, b) => (b.averagePercentage ?? 0) - (a.averagePercentage ?? 0))

  const strongestSubject = assessedSubjects.length > 0 ? assessedSubjects[0] : null
  const weakestSubject =
    assessedSubjects.length > 0 ? assessedSubjects[assessedSubjects.length - 1] : null

  // collect and sort upcoming deadlines (both tasks and exams)
  const upcomingDeadlines = [
    ...data.exams
      .filter((e) => getDaysBetween(e.date) >= 0)
      .map((e) => ({
        id: e.id,
        title: e.title,
        subjectId: e.subjectId,
        date: e.date,
        type: 'Exam',
        daysLeft: getDaysBetween(e.date),
      })),
    ...data.tasks
      .filter((t) => t.dueDate && t.status !== 'completed' && getDaysBetween(t.dueDate) >= 0)
      .map((t) => ({
        id: t.id,
        title: t.title,
        subjectId: t.subjectId,
        date: t.dueDate!,
        type: t.type.replace('_', ' '),
        daysLeft: getDaysBetween(t.dueDate!),
      })),
  ].sort((a, b) => a.daysLeft - b.daysLeft)

  // quick toggle task completion directly from priority list
  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = data.tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    )
    const updatedData = { ...data, tasks: updatedTasks }
    setData(updatedData)
    saveData(updatedData)
  }

  // empty state when no profile/subjects exist
  if (!hasSubjects) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your daily academic decision center.
          </p>
        </div>
        <EmptyState
          icon={LayoutDashboard}
          title="No academic profile set up"
          description="Complete the quick 3-step setup to enter your current degree, subjects, and study hours budget."
          actionLabel="Start Onboarding"
          actionLink="/onboarding"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {data.profile.name ? `Welcome, ${data.profile.name}` : 'Student Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {data.profile.degree
              ? `${data.profile.degree} · Semester ${data.profile.semester}`
              : 'Daily academic prioritization and focus recommendations.'}
          </p>
        </div>

        {/* ONE CLEAR PRIMARY ACTION */}
        <div className="flex items-center gap-3">
          {topPriorities.length > 0 ? (
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
            >
              <span>Focus on #{1} Priority</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Task
            </Link>
          )}
        </div>
      </div>

      {/* 2. ONE OR TWO SHORT INSIGHTS MAX */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 shadow-xs"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {insight}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. TODAY'S PRIORITIES (THE ENGINE OUTPUT) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Today's Priorities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked dynamically by deadline urgency, subject weakness, difficulty, and available hours.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Daily target: {data.profile.dailyStudyHoursTarget || 3} hrs
          </span>
        </div>

        {!hasItemsToRank ? (
          <EmptyState
            icon={Calendar}
            title="No tasks or exams scheduled"
            description="Add your assignments, exam milestones, or study sessions to let the engine determine your daily priorities."
            actionLabel="Schedule Your First Task"
            actionLink="/planner"
          />
        ) : topPriorities.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 bg-white/40 dark:bg-slate-900/40">
            All current tasks are completed! Enjoy your break or schedule new revision topics in the planner.
          </div>
        ) : (
          <div className="space-y-3">
            {topPriorities.map((item, index) => {
              const isExam = item.itemType === 'exam'

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 transition-colors shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* rank badge */}
                      <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* subject tag */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${item.subjectColor}20`,
                          color: item.subjectColor,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.subjectColor }} />
                        {item.subjectName}
                      </span>

                      {/* item type */}
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        {isExam ? 'Exam Prep' : 'Task'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* suggested minutes */}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" /> Suggested: {item.suggestedMinutes} min
                      </span>

                      {/* priority score */}
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        title="Priority Score out of 100"
                      >
                        Priority {item.score}
                      </span>

                      {/* mark completed button for tasks */}
                      {!isExam && (
                        <button
                          type="button"
                          onClick={() => handleCompleteTask(item.id)}
                          className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                          title="Mark task completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* title */}
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 pl-9">
                    {item.title}
                  </h3>

                  {/* WHY EXPLANATIONS */}
                  <div className="pl-9 pt-1">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Why this is prioritized:
                    </div>
                    <ul className="space-y-1">
                      {item.reasons.map((reason, rIdx) => (
                        <li
                          key={rIdx}
                          className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. BOTTOM GRID: UPCOMING DEADLINES + STRONGEST / WEAKEST SUBJECTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UPCOMING DEADLINES */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Upcoming Deadlines ({upcomingDeadlines.length})
            </h3>
            <Link to="/exams" className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              View all exams
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-lg">
              No upcoming deadlines in the next 2 weeks.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.slice(0, 4).map((d) => {
                const subject = data.subjects.find((s) => s.id === d.subjectId)
                return (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{d.title}</span>
                        <span className="text-[10px] text-slate-500 capitalize bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {d.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{subject?.name}</div>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                        d.daysLeft <= 2
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : d.daysLeft <= 6
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {d.daysLeft === 0 ? 'Today' : d.daysLeft === 1 ? 'Tomorrow' : `In ${d.daysLeft} days`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* STRONGEST & WEAKEST SUBJECTS */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Subject Performance</h3>
            <Link
              to="/performance"
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Log marks
            </Link>
          </div>

          {assessedSubjects.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-lg space-y-2">
              <AlertCircle className="w-5 h-5 text-slate-400 mx-auto" />
              <div className="text-xs text-slate-500">No marks recorded yet</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Log quiz or midterm marks in the Performance section to identify your strongest and weakest subjects.
              </p>
              <Link
                to="/performance"
                className="inline-block text-xs font-medium text-slate-900 dark:text-slate-100 underline pt-1"
              >
                Log your first score →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Strongest */}
              {strongestSubject && (
                <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" /> Strongest Subject
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {strongestSubject.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {strongestSubject.averagePercentage}%
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {strongestSubject.assessmentCount} assessment(s)
                    </div>
                  </div>
                </div>
              )}

              {/* Weakest */}
              {weakestSubject && (
                <div className="p-3 rounded-lg border border-rose-100 dark:border-rose-950/50 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                      <TrendingDown className="w-3.5 h-3.5" /> Weakest Subject
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {weakestSubject.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                      {weakestSubject.averagePercentage}%
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {weakestSubject.trend === 'declining'
                        ? 'Marks dropped recently'
                        : `${weakestSubject.assessmentCount} assessment(s)`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
