import { useState, useEffect } from 'react'
import { loadData, saveData } from '../storage'
import type { AppData, Exam, Topic } from '../types'
import { calculateExamReadiness } from '../engine/readiness'
import { EmptyState } from '../components/EmptyState'
import { useConfirm, useToast } from '../components/FeedbackContext'
import {
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
} from 'lucide-react'

// days countdown helper
function getDaysDiff(examDateStr: string): number {
  const examDate = new Date(examDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  examDate.setHours(0, 0, 0, 0)
  const diffTime = examDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function ExamsPage() {
  useEffect(() => {
    document.title = 'Exams & Readiness | Student Life Optimizer'
  }, [])

  const confirm = useConfirm()
  const toast = useToast()

  const [data, setData] = useState<AppData>(() => loadData())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null)

  // form state
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id || '')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [targetScore, setTargetScore] = useState(85)
  const [topics, setTopics] = useState<Topic[]>([])

  // inline topic adder state
  const [topicName, setTopicName] = useState('')
  const [topicWeight, setTopicWeight] = useState(3)
  const [topicConfidence, setTopicConfidence] = useState(3)
  const [formError, setFormError] = useState('')

  // reset form
  const resetForm = () => {
    setShowAddForm(false)
    setEditingExamId(null)
    setTitle('')
    setDate('')
    setTargetScore(85)
    setTopics([])
    setTopicName('')
    setTopicWeight(3)
    setTopicConfidence(3)
    setFormError('')
  }

  // open edit form
  const handleEdit = (exam: Exam) => {
    setEditingExamId(exam.id)
    setSubjectId(exam.subjectId)
    setTitle(exam.title)
    setDate(exam.date)
    setTargetScore(exam.targetScore || 85)
    setTopics(exam.topics || [])
    setShowAddForm(true)
    setFormError('')
  }

  // add topic to currently drafted exam
  const handleAddTopic = () => {
    const trimmed = topicName.trim()
    if (!trimmed) return

    const newTopic: Topic = {
      id: 'top_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: trimmed,
      weight: Number(topicWeight),
      confidence: Number(topicConfidence),
      completed: false,
    }

    setTopics([...topics, newTopic])
    setTopicName('')
    setTopicWeight(3)
    setTopicConfidence(3)
  }

  // remove topic from drafted exam
  const handleRemoveTopic = (topId: string) => {
    setTopics(topics.filter((t) => t.id !== topId))
  }

  // save exam (add or update)
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault()

    if (!subjectId) {
      setFormError('Please select a subject.')
      return
    }
    if (!title.trim()) {
      setFormError('Please enter an exam title.')
      return
    }
    if (!date) {
      setFormError('Please select an exam date.')
      return
    }

    let updatedExams: Exam[]

    if (editingExamId) {
      updatedExams = data.exams.map((ex) =>
        ex.id === editingExamId
          ? {
              ...ex,
              subjectId,
              title: title.trim(),
              date,
              targetScore: Number(targetScore) || 85,
              topics,
            }
          : ex
      )
    } else {
      const newExam: Exam = {
        id: 'exam_' + Date.now(),
        subjectId,
        title: title.trim(),
        date,
        targetScore: Number(targetScore) || 85,
        topics,
      }
      updatedExams = [...data.exams, newExam]
    }

    const updatedData: AppData = { ...data, exams: updatedExams }
    setData(updatedData)
    saveData(updatedData)
    resetForm()
  }

  // delete exam
  const handleDeleteExam = async (id: string, examTitle: string) => {
    const confirmed = await confirm({
      title: 'Delete Exam',
      message: `Are you sure you want to delete exam "${examTitle}" and its syllabus topics?`,
      confirmText: 'Delete Exam',
      isDestructive: true,
    })
    if (!confirmed) return

    const updatedData: AppData = {
      ...data,
      exams: data.exams.filter((ex) => ex.id !== id),
    }
    setData(updatedData)
    saveData(updatedData)
    toast.success(`Exam "${examTitle}" deleted`)
  }

  // toggle topic completion from list view
  const toggleTopicCompletion = (examId: string, topicId: string) => {
    const updatedExams = data.exams.map((ex) => {
      if (ex.id !== examId) return ex
      return {
        ...ex,
        topics: ex.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t)),
      }
    })
    const updatedData = { ...data, exams: updatedExams }
    setData(updatedData)
    saveData(updatedData)
  }

  // if no subjects exist at all, guide user to add subjects first
  if (data.subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Exams</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keep track of upcoming exams and syllabus coverage.
          </p>
        </div>
        <EmptyState
          icon={ClipboardList}
          title="No subjects enrolled"
          description="You need to add at least one subject before you can schedule exams and syllabus topics."
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
            Exams & Readiness
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explainable readiness scores derived from syllabus coverage, topic confidence, past marks, and days left.
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
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        )}
      </div>

      {/* ADD / EDIT EXAM FORM */}
      {showAddForm && (
        <form onSubmit={handleSaveExam} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingExamId ? 'Edit Exam' : 'Schedule New Exam'}
            </h2>
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
                Exam Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm 1 or Final Exam"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* TOPICS BREAKDOWN */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Syllabus Topics ({topics.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rate topic importance (weight 1-5) and your confidence (1-5) to calculate your readiness.
                </p>
              </div>
            </div>

            {/* inline topic adder */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="Topic name (e.g. Dynamic Programming)"
                className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />

              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <span>Importance:</span>
                <select
                  value={topicWeight}
                  onChange={(e) => setTopicWeight(Number(e.target.value))}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Moderate</option>
                  <option value={3}>3 - Standard</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Critical</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <span>Confidence:</span>
                <select
                  value={topicConfidence}
                  onChange={(e) => setTopicConfidence(Number(e.target.value))}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value={1}>1 - Weak</option>
                  <option value={2}>2 - Shaky</option>
                  <option value={3}>3 - Fair</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Mastered</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddTopic}
                disabled={!topicName.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Topic
              </button>
            </div>

            {/* list of topics added to draft */}
            {topics.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {topics.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                  >
                    <span className="font-medium">{t.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">Weight: {t.weight}/5</span>
                      <span className="text-[11px] text-slate-500">Confidence: {t.confidence}/5</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(t.id)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
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
              {editingExamId ? 'Update Exam' : 'Save Exam'}
            </button>
          </div>
        </form>
      )}

      {/* EXAMS LIST WITH FULL READINESS SCORE & EXPLAINABLE BREAKDOWN */}
      {data.exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No exams scheduled yet"
          description="Add an upcoming test or exam with its syllabus topics to start tracking what needs revision."
          actionLabel="Add Your First Exam"
          onAction={() => {
            resetForm()
            setSubjectId(data.subjects[0]?.id || '')
            setShowAddForm(true)
          }}
        />
      ) : (
        <div className="space-y-6">
          {data.exams.map((exam) => {
            const subject = data.subjects.find((s) => s.id === exam.subjectId)
            const daysDiff = getDaysDiff(exam.date)
            const isExpanded = expandedExamId === exam.id

            // compute explainable readiness score from engine
            const readiness = calculateExamReadiness({
              exam,
              assessments: data.assessments,
            })

            const isHighReadiness = readiness.score >= 75
            const isMidReadiness = readiness.score >= 50 && readiness.score < 75

            return (
              <div
                key={exam.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
              >
                {/* EXAM CARD HEADER */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${subject?.color || '#64748b'}20`,
                          color: subject?.color || '#64748b',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject?.color }} />
                        {subject?.name || 'General'}
                      </span>

                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          daysDiff < 0
                            ? 'bg-slate-100 text-slate-500'
                            : daysDiff <= 3
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            : daysDiff <= 7
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {daysDiff < 0
                          ? 'Passed'
                          : daysDiff === 0
                          ? 'Today'
                          : daysDiff === 1
                          ? 'Tomorrow'
                          : `In ${daysDiff} days`}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{exam.title}</h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Date: {exam.date}
                      </span>
                      <span>Target: {exam.targetScore || 85}%</span>
                      <span>{exam.topics.length} syllabus topics</span>
                    </div>
                  </div>

                  {/* READINESS SCORE PILL & ACTIONS */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        Readiness
                      </div>
                      <span
                        className={`text-2xl font-black ${
                          isHighReadiness
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isMidReadiness
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {readiness.score}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleEdit(exam)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        title="Edit exam"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ALWAYS VISIBLE: READINESS EXPLANATION & BREAKDOWN */}
                <div className="p-5 bg-slate-50/40 dark:bg-slate-950/30 space-y-4">
                  {/* METRICS ROW */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block text-[11px]">Recommended Study</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 inline-flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> ~{readiness.recommendedStudyHours} hrs
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block text-[11px]">Strong Topics</span>
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {readiness.strongTopics.length} mastered
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block text-[11px]">Weak Topics</span>
                      <span className="font-bold text-sm text-rose-600 dark:text-rose-400 mt-0.5 block">
                        {readiness.weakTopics.length} need focus
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-slate-400 block text-[11px]">Remaining Topics</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5 block">
                        {readiness.remainingTopics.length} unfinished
                      </span>
                    </div>
                  </div>

                  {/* REASONS LIST */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Readiness Rationale:
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {readiness.reasons.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* PRIORITY TOPICS TO STUDY FIRST */}
                  {readiness.priorityTopics.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-500" />
                        <span>Recommended Revision Priorities:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {readiness.priorityTopics.slice(0, 4).map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          >
                            <span>{t.name}</span>
                            <span className="text-[10px] text-slate-400">
                              (Weight: {t.weight}, Conf: {t.confidence})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EXPANDABLE TOPIC MANAGEMENT */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          Hide Syllabus Topics <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Manage Topics & Check Off Progress ({exam.topics.length}){' '}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* EXPANDED TOPICS LIST FOR INTERACTIVE CHECKLIST */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-white dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Interactive Topic Checklist:
                    </div>

                    {exam.topics.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">
                        No topics listed. Click edit to add topics and unlock readiness scoring.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {exam.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                              topic.completed
                                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer flex-1 mr-2">
                              <input
                                type="checkbox"
                                checked={topic.completed}
                                onChange={() => toggleTopicCompletion(exam.id, topic.id)}
                                className="rounded text-slate-900 focus:ring-0"
                              />
                              <span className={topic.completed ? 'line-through text-slate-400' : 'font-medium'}>
                                {topic.name}
                              </span>
                            </label>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                title={`Importance: ${topic.weight}/5`}
                              >
                                W:{topic.weight}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  topic.confidence <= 2
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                    : topic.confidence >= 4
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                                title={`Confidence: ${topic.confidence}/5`}
                              >
                                C:{topic.confidence}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
