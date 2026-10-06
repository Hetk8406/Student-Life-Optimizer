import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadData } from '../storage'
import { ArrowLeft, ArrowRight, BookOpen, Clock, Target } from 'lucide-react'

export function HowItWorksPage() {
  useEffect(() => {
    document.title = 'How It Works | Student Life Optimizer'
  }, [])

  const data = loadData()
  const startDestination = data.profile.onboardingCompleted ? '/dashboard' : '/onboarding'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link
            to={startDestination}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            {data.profile.onboardingCompleted ? 'Open App' : 'Get Started'}
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
          How Student Life Optimizer Works
        </h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
          Traditional planners require you to schedule everything manually and assume you follow plans 100% of the time. Student Life Optimizer works differently:
        </p>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-base">1. Real Academic Context</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
              You add your subjects, upcoming exams, syllabus topics, and marks from assignments or quizzes. All data remains stored in your browser using local storage.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-base">2. Realistic Time Constraints</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
              You set your realistic weekly study budget (e.g. 20 hours). Instead of dumping 50 hours of tasks into your week, the system only queues what actually fits your time.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs flex items-center justify-center">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-base">3. Transparent Recommendations</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
              The decision engine prioritizes subjects that have upcoming exams, high topic weights, or declining marks. Every recommendation provides its reasons directly so you understand why it matters.
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1">Ready to set up your subjects?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Takes less than 2 minutes to complete onboarding.</p>
          </div>
          <Link
            to={startDestination}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Start Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
