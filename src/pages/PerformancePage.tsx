import { useState, useEffect } from 'react'
import { loadData, saveData } from '../storage'
import type { AppData, Assessment } from '../types'
import {
  analyzeSubjectTrend,
  calculateStudyTimeCorrelation,
  generatePerformanceInsights,
} from '../engine/performance'
import { EmptyState } from '../components/EmptyState'
import { useConfirm, useToast } from '../components/FeedbackContext'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  AlertCircle,
  BarChart2,
  LineChart as LineChartIcon,
  Lightbulb,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export function PerformancePage() {
  useEffect(() => {
    document.title = 'Academic Performance | Student Life Optimizer'
  }, [])

  const confirm = useConfirm()
  const toast = useToast()

  const [data, setData] = useState<AppData>(() => loadData())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(data.subjects[0]?.id || '')

  // form state
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id || '')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Assessment['type']>('quiz')
  const [score, setScore] = useState<number | ''>('')
  const [maxScore, setMaxScore] = useState<number | ''>(100)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [formError, setFormError] = useState('')

  // run engine trend analysis
  const trendAnalyses = data.subjects.map((sub) => analyzeSubjectTrend(sub, data.assessments))
  const correlations = calculateStudyTimeCorrelation(data.subjects, data.assessments, data.sessions)
  const insights = generatePerformanceInsights(trendAnalyses, correlations)

  // reset form
  const resetForm = () => {
    setShowAddForm(false)
    setEditingAssessmentId(null)
    setTitle('')
    setScore('')
    setMaxScore(100)
    setDate(new Date().toISOString().slice(0, 10))
    setType('quiz')
    setFormError('')
  }

  // open edit form
  const handleEdit = (a: Assessment) => {
    setEditingAssessmentId(a.id)
    setSubjectId(a.subjectId)
    setTitle(a.title)
    setType(a.type)
    setScore(a.score)
    setMaxScore(a.maxScore)
    setDate(a.date)
    setShowAddForm(true)
    setFormError('')
  }

  // save marks (add or edit)
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault()

    if (!subjectId) {
      setFormError('Please select a subject.')
      return
    }
    if (!title.trim()) {
      setFormError('Please enter an assessment title.')
      return
    }
    if (score === '' || Number(score) < 0) {
      setFormError('Marks obtained must be 0 or higher.')
      return
    }
    if (maxScore === '' || Number(maxScore) <= 0) {
      setFormError('Maximum marks must be greater than 0.')
      return
    }
    if (Number(score) > Number(maxScore)) {
      setFormError('Marks obtained cannot exceed maximum marks.')
      return
    }
    if (!date) {
      setFormError('Please select a date.')
      return
    }

    const numScore = Number(score)
    const numMax = Number(maxScore)
    const percentage = Number(((numScore / numMax) * 100).toFixed(1))

    let updatedAssessments: Assessment[]
    if (editingAssessmentId) {
      updatedAssessments = data.assessments.map((a) =>
        a.id === editingAssessmentId
          ? {
              ...a,
              subjectId,
              title: title.trim(),
              type,
              score: numScore,
              maxScore: numMax,
              percentage,
              date,
            }
          : a
      )
    } else {
      const newAssessment: Assessment = {
        id: 'ass_' + Date.now(),
        subjectId,
        title: title.trim(),
        type,
        score: numScore,
        maxScore: numMax,
        percentage,
        date,
      }
      updatedAssessments = [...data.assessments, newAssessment]
    }

    const updatedData: AppData = { ...data, assessments: updatedAssessments }
    setData(updatedData)
    saveData(updatedData)
    resetForm()
  }

  // delete marks
  const handleDelete = async (id: string, itemTitle: string) => {
    const confirmed = await confirm({
      title: 'Delete Assessment',
      message: `Are you sure you want to delete assessment "${itemTitle}"? Your subject average will be recalculated.`,
      confirmText: 'Delete Assessment',
      isDestructive: true,
    })
    if (!confirmed) return

    const updatedData = {
      ...data,
      assessments: data.assessments.filter((a) => a.id !== id),
    }
    setData(updatedData)
    saveData(updatedData)
    toast.success(`Assessment "${itemTitle}" deleted`)
  }

  // data preparation for charts
  // 1. Trend line chart data for selected subject
  const selectedTrend = trendAnalyses.find((t) => t.subjectId === selectedSubjectId)
  const trendChartData =
    selectedTrend?.assessments.map((a) => ({
      title: a.title,
      date: a.date,
      score: a.percentage,
    })) || []

  // 2. Subject comparison data
  const comparisonChartData = trendAnalyses
    .filter((t) => t.assessments.length > 0)
    .map((t) => {
      const sub = data.subjects.find((s) => s.id === t.subjectId)
      return {
        name: t.subjectName,
        average: t.averagePercentage,
        target: sub?.targetGrade || 80,
      }
    })

  // empty subjects guard
  if (data.subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Academic Performance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track marks, analyze trends, and correlate study hours with results.
          </p>
        </div>
        <EmptyState
          icon={TrendingUp}
          title="No subjects enrolled"
          description="Add your enrolled subjects in your profile before recording marks and performance trends."
          actionLabel="Add Subjects in Profile"
          actionLink="/profile"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Academic Performance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track exam and quiz scores, detect improving or declining trends, and compare study time vs grades.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => {
              resetForm()
              setSubjectId(data.subjects[0]?.id || '')
              setShowAddForm(true)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors self-start"
          >
            <Plus className="w-4 h-4" /> Log Marks
          </button>
        )}
      </div>

      {/* 1. PLAIN-LANGUAGE INSIGHTS BANNER */}
      {insights.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Lightbulb className="w-4 h-4 text-slate-500" />
            <span>Performance Insights</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {insights.map((ins, i) => (
              <p key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {ins}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2. SUBJECT TREND CARDS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {trendAnalyses.map((item) => (
          <div
            key={item.subjectId}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {item.subjectName}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 ${
                  item.trend === 'improving'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : item.trend === 'declining'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {item.trend === 'improving' && <TrendingUp className="w-3 h-3" />}
                {item.trend === 'declining' && <TrendingDown className="w-3 h-3" />}
                {item.trend === 'improving'
                  ? 'Improving'
                  : item.trend === 'declining'
                  ? item.consecutiveDrops >= 3
                    ? `${item.consecutiveDrops} drops in a row`
                    : 'Declining'
                  : item.trend === 'stable'
                  ? 'Stable'
                  : 'No marks'}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Average:</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {item.assessments.length > 0 ? `${item.averagePercentage}%` : '—'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {item.insight}
            </p>
          </div>
        ))}
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHART 1: MARKS TREND LINE PER SUBJECT */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Marks Trend Line</h3>
            </div>

            {/* subject picker for trend */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
            >
              {data.subjects.map((sub) => (
                <option key={sub.id} value={sub.id} className="dark:bg-slate-900">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {trendChartData.length < 2 ? (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center p-4">
              <LineChartIcon className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-1" />
              <span className="text-xs font-medium text-slate-500">Not enough data yet</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log at least 2 assessments for this subject to reveal its trend line.
              </p>
            </div>
          ) : (
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 12,
                      border: 'none',
                    }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHART 2: SUBJECT COMPARISON BAR CHART */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Subject Grade Comparison
            </h3>
          </div>

          {comparisonChartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center p-4">
              <BarChart2 className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-1" />
              <span className="text-xs font-medium text-slate-500">Not enough data yet</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log marks to compare performance averages across subjects.
              </p>
            </div>
          ) : (
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 12,
                      border: 'none',
                    }}
                    formatter={(val) => [`${val}%`, 'Average']}
                  />
                  <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* CHART 3: STUDY TIME VS MARKS CORRELATION */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Study Time vs Assessment Scores
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Shows logged actual study hours against average score per subject.
          </p>
        </div>

        {correlations.length < 2 ? (
          <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center p-4">
            <span className="text-xs font-medium text-slate-500">Not enough correlation data yet</span>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
              Requires both logged study sessions in the Planner and assessment marks for at least 2 subjects to reveal how your time investment impacts marks.
            </p>
          </div>
        ) : (
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlations} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="subjectName" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 12,
                    border: 'none',
                  }}
                />
                <Bar yAxisId="left" dataKey="averageScore" name="Avg Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="studyHours" name="Study Hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. ADD / EDIT MARKS FORM */}
      {showAddForm && (
        <form onSubmit={handleSaveAssessment} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingAssessmentId ? 'Edit Assessment Marks' : 'Log New Assessment Marks'}
            </h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {data.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="dark:bg-slate-900">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quiz 1, Midterm Exam, Lab Test"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Assessment['type'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="quiz" className="dark:bg-slate-900">Quiz</option>
                <option value="assignment" className="dark:bg-slate-900">Assignment</option>
                <option value="midterm" className="dark:bg-slate-900">Midterm Exam</option>
                <option value="final" className="dark:bg-slate-900">Final Exam</option>
                <option value="project" className="dark:bg-slate-900">Project</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marks Obtained <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={score}
                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 18"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min={1}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 20"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Received <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
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
              {editingAssessmentId ? 'Update Marks' : 'Save Marks'}
            </button>
          </div>
        </form>
      )}

      {/* 5. MARKS LOGGED LIST */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          All Assessment Marks ({data.assessments.length})
        </h3>

        {data.assessments.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No marks logged yet"
            description="Log marks from your quizzes, midterms, and lab assignments to track your subject grades."
            actionLabel="Log Your First Mark"
            onAction={() => {
              resetForm()
              setSubjectId(data.subjects[0]?.id || '')
              setShowAddForm(true)
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {data.assessments.map((a) => {
              const subject = data.subjects.find((s) => s.id === a.subjectId)
              const isGood = a.percentage >= 80
              const isMid = a.percentage >= 60 && a.percentage < 80

              return (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shadow-2xs"
                >
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
                        {a.type}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {a.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {a.score} <span className="text-xs font-normal text-slate-400">/ {a.maxScore}</span>
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          isGood
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : isMid
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {a.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(a)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        title="Edit assessment"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id, a.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
