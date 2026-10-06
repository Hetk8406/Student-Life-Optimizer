import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  TrendingUp,
  ClipboardList,
  Briefcase,
  Flag,
  Lightbulb,
  Settings,
  Menu,
  X,
  Download,
  Upload
} from 'lucide-react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { useConfirm, useToast } from './FeedbackContext'
import { loadData, exportToJson, importFromJson } from '../storage'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'Study Planner', icon: CalendarCheck },
  { to: '/performance', label: 'Performance', icon: TrendingUp },
  { to: '/exams', label: 'Exams', icon: ClipboardList },
  { to: '/skills', label: 'Skills & Career', icon: Briefcase },
  { to: '/goals', label: 'Goals', icon: Flag },
  { to: '/insights', label: 'Insights', icon: Lightbulb },
  { to: '/profile', label: 'Profile', icon: Settings },
]

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  // handle quick json export
  const handleExport = () => {
    const data = loadData()
    exportToJson(data)
    toast.success('Data exported to JSON')
  }

  // handle quick json file import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const confirmed = await confirm({
          title: 'Import Backup Data',
          message: 'Importing this backup will overwrite your current data. Are you sure you want to proceed?',
          confirmText: 'Overwrite & Import',
          isDestructive: true,
        })
        if (!confirmed) {
          e.target.value = ''
          return
        }

        importFromJson(content)
        toast.success('Data imported successfully')
        setTimeout(() => window.location.reload(), 600)
      } catch (err) {
        console.error('Import failed', err)
        toast.error('Could not import file: invalid JSON format.')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="h-16 px-6 flex items-center border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-base tracking-tight text-slate-900 dark:text-slate-100 hover:opacity-90 transition-opacity">
            <Logo className="w-5 h-5 text-slate-900 dark:text-slate-100 shrink-0" />
            <span>Student Life Optimizer</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* bottom backup actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Backup your data to a JSON file"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <label
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Restore data from a JSON file"
            >
              <Upload className="w-3.5 h-3.5" /> Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <div className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Browser storage (localStorage)
          </div>
        </div>
      </aside>

      {/* mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 bg-white dark:bg-slate-900 p-4 flex flex-col z-50">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 font-semibold text-sm hover:opacity-90"
              >
                <Logo className="w-4 h-4 text-slate-900 dark:text-slate-100 shrink-0" />
                <span>Student Life Optimizer</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* top header bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
            Autonomous decision engine for academic & career priorities
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Link
              to="/how-it-works"
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              How it works
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* page view */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
