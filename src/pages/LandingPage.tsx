import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadData } from '../storage'
import { Logo } from '../components/Logo'
import { ArrowRight, BookOpen, Clock, Target } from 'lucide-react'

export function LandingPage() {
  useEffect(() => {
    document.title = 'Student Life Optimizer'
  }, [])

  // if onboarding already done, button goes straight to dashboard
  const data = loadData()
  const startDestination = data.profile.onboardingCompleted ? '/dashboard' : '/onboarding'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-base tracking-tight hover:opacity-90 transition-opacity"
          >
            <Logo className="w-5 h-5 text-slate-900 dark:text-slate-100 shrink-0" />
            <span>Student Life Optimizer</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/how-it-works"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              How It Works
            </Link>
            <Link
              to={startDestination}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Open App
            </Link>
          </nav>
        </div>
      </header>

      {/* hero */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-6">
          Free & Private · Runs entirely in your browser
        </span>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6 leading-tight">
          "What should I do next?"
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Most student tools are just empty to-do lists. Student Life Optimizer takes your subjects, upcoming exams, marks, and available hours to tell you exactly where your time is best spent today.
        </p>

        {/* single primary button to start */}
        <Link
          to={startDestination}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium text-base hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm"
        >
          {data.profile.onboardingCompleted ? 'Go to Dashboard' : 'Get Started'} <ArrowRight className="w-4 h-4" />
        </Link>

        {/* simple 3-step explanation */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 text-left">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Step 1</div>
            <h3 className="font-semibold text-sm mb-1.5 text-slate-900 dark:text-slate-100">Add Academic Context</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter your current subjects, syllabus topics, upcoming exam dates, and recent marks.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Step 2</div>
            <h3 className="font-semibold text-sm mb-1.5 text-slate-900 dark:text-slate-100">Define Study Budget</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Set how many hours you realistically have per week so the planner avoids impossible schedules.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Step 3</div>
            <h3 className="font-semibold text-sm mb-1.5 text-slate-900 dark:text-slate-100">Get Clear Priorities</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Get an explainable list of what to study each day based on urgency, topic weight, and weaknesses.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Student Life Optimizer · All data is stored locally in your browser. No account required.
      </footer>
    </div>
  )
}
