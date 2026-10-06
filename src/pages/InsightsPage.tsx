import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadData } from '../storage'
import type { AppData } from '../types'
import { generateMasterInsights } from '../engine/insights'
import { EmptyState } from '../components/EmptyState'
import {
  Lightbulb,
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  CalendarCheck,
  Briefcase,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  Academics: BookOpen,
  'Time & Pacing': Clock,
  'Study Habits': CalendarCheck,
  'Skills & Career': Briefcase,
  'Daily Priorities': Target,
}

export function InsightsPage() {
  useEffect(() => {
    document.title = 'Smart Insights | Student Life Optimizer'
  }, [])

  const [data] = useState<AppData>(() => loadData())

  const insights = generateMasterInsights(data)
  const hasData = data.subjects.length > 0

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Smart Insights</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Synthesizing your academic trends, study pacing, and career gaps into actionable observations.
          </p>
        </div>
        <EmptyState
          icon={Lightbulb}
          title="No student data yet"
          description="Complete onboarding and log your subjects to let the intelligence engine generate personalized insights."
          actionLabel="Complete Profile"
          actionLink="/profile"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Smart Insights
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {insights.length} active
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A small set of explainable observations across your academics, study pacing, habits, and career benchmarks.
        </p>
      </div>

      {insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Not enough activity yet"
          description="Log study sessions in the Planner and assessment marks in Performance to unlock multi-domain insights."
          actionLabel="Go to Study Planner"
          actionLink="/planner"
        />
      ) : (
        <div className="space-y-4">
          {insights.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Lightbulb

            return (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      item.type === 'alert'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        : item.type === 'positive'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {item.category}
                    </span>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.actionLabel && item.actionLink && (
                  <Link
                    to={item.actionLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 self-end sm:self-center shrink-0 transition-colors"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
