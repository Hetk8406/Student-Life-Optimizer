import { useState, useEffect } from 'react'
import { loadData, saveData } from '../storage'
import type { AppData } from '../types'
import {
  REFERENCE_CAREER_PATHS,
  analyzeSkillGaps,
  type CareerPath,
} from '../engine/skills'
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Bookmark,
} from 'lucide-react'

function createSkillId(name: string): string {
  return 'sk_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

export function SkillsCareerPage() {
  useEffect(() => {
    document.title = 'Skills & Career | Student Life Optimizer'
  }, [])
  const [data, setData] = useState<AppData>(() => loadData())

  // find initial career path matching profile.careerGoal or default to first
  const initialPath =
    REFERENCE_CAREER_PATHS.find(
      (p) =>
        p.title.toLowerCase() === (data.profile.careerGoal || '').toLowerCase() ||
        p.id === data.profile.primaryCareerGoalId
    ) || REFERENCE_CAREER_PATHS[0]

  const [selectedPathId, setSelectedPathId] = useState<string>(initialPath.id)

  const activePath: CareerPath =
    REFERENCE_CAREER_PATHS.find((p) => p.id === selectedPathId) || REFERENCE_CAREER_PATHS[0]

  // build rating dictionary from data.skills
  const userRatings: Record<string, number> = {}
  data.skills.forEach((s) => {
    userRatings[s.name] = s.currentLevel
  })

  // run gap engine
  const analysis = analyzeSkillGaps(activePath, userRatings)

  // handle updating a skill rating
  const handleRatingChange = (skillName: string, newLevel: number) => {
    const val = Math.max(0, Math.min(100, newLevel))

    const existingIndex = data.skills.findIndex((s) => s.name === skillName)
    let updatedSkills = [...data.skills]

    if (existingIndex >= 0) {
      updatedSkills[existingIndex] = {
        ...updatedSkills[existingIndex],
        currentLevel: val,
      }
    } else {
      updatedSkills.push({
        id: createSkillId(skillName),
        name: skillName,
        category: 'programming',
        currentLevel: val,
      })
    }

    const updatedData: AppData = { ...data, skills: updatedSkills }
    setData(updatedData)
    saveData(updatedData)
  }

  // set as primary career goal
  const handleSetPrimary = () => {
    const updatedData: AppData = {
      ...data,
      profile: {
        ...data.profile,
        careerGoal: activePath.title,
        primaryCareerGoalId: activePath.id,
      },
    }
    setData(updatedData)
    saveData(updatedData)
  }

  const isPrimary =
    (data.profile.careerGoal || '').toLowerCase() === activePath.title.toLowerCase() ||
    data.profile.primaryCareerGoalId === activePath.id

  // group skills by roadmap stage (1 to 5)
  const stages = [1, 2, 3, 4, 5]

  return (
    <div className="space-y-8 pb-12">
      {/* top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Skills & Career Navigator
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Reference Data
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare your self-assessed abilities against curated career standards to spot gaps and recommended next skills.
          </p>
        </div>

        {!isPrimary && (
          <button
            type="button"
            onClick={handleSetPrimary}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start"
          >
            <Bookmark className="w-3.5 h-3.5" /> Set as Primary Career Goal
          </button>
        )}
      </div>

      {/* CAREER TRACK SELECTOR */}
      <div className="flex flex-wrap gap-2">
        {REFERENCE_CAREER_PATHS.map((path) => (
          <button
            key={path.id}
            onClick={() => setSelectedPathId(path.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedPathId === path.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {path.title}
          </button>
        ))}
      </div>

      {/* SUMMARY BANNER: MATCH % + NEXT RECOMMENDED SKILL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ROLE READINESS CARD */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Role Match
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {analysis.overallMatchPercentage}%
            </span>
            <span className="text-xs text-slate-400">of benchmark criteria</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 dark:bg-slate-100 h-full transition-all"
              style={{ width: `${analysis.overallMatchPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{analysis.completedCount} Met</span>
            <span>{analysis.inProgressCount} In Progress</span>
            <span>{analysis.missingCount} Missing</span>
          </div>
        </div>

        {/* NEXT RECOMMENDED SKILL CARD */}
        <div className="md:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Next Recommended Skill to Learn</span>
          </div>

          {analysis.nextRecommendedSkill ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {analysis.nextRecommendedSkill.name}
                </h3>
                <span className="text-xs text-slate-500">
                  Stage {analysis.nextRecommendedSkill.stage} · Target: {analysis.nextRecommendedSkill.requiredLevel}%
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {analysis.nextRecommendedSkill.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.nextRecommendedSkill.reasons.map((r, rIdx) => (
                  <span
                    key={rIdx}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <ArrowRight className="w-3 h-3 text-slate-400" /> {r}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-4">
              All benchmark skills for {activePath.title} are completed! You are fully aligned with this role standard.
            </div>
          )}
        </div>
      </div>

      {/* STAGED ROADMAP TIMELINE */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Staged Learning Roadmap
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Skills are staged sequentially so you master fundamentals before jumping to specialized topics.
          </p>
        </div>

        <div className="space-y-6">
          {stages.map((stageNum) => {
            const stageSkills = analysis.evaluatedSkills.filter((s) => s.stage === stageNum)
            if (stageSkills.length === 0) return null

            const allDone = stageSkills.every((s) => s.status === 'completed')

            return (
              <div key={stageNum} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    {stageNum}
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Stage {stageNum} {allDone && <span className="text-emerald-500 normal-case">(Completed)</span>}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                  {stageSkills.map((skill) => (
                    <div
                      key={skill.name}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{skill.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize inline-flex items-center gap-1 ${
                            skill.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : skill.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          {skill.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {skill.status === 'in_progress' && <Clock className="w-3 h-3" />}
                          {skill.status === 'missing' && <AlertCircle className="w-3 h-3" />}
                          {skill.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Your rating: {skill.currentLevel}%</span>
                          <span>Target: {skill.requiredLevel}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              skill.status === 'completed'
                                ? 'bg-emerald-500'
                                : skill.status === 'in_progress'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(100, (skill.currentLevel / skill.requiredLevel) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* interactive rating slider */}
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 shrink-0">Adjust:</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={skill.currentLevel}
                          onChange={(e) => handleRatingChange(skill.name, Number(e.target.value))}
                          className="w-full accent-slate-900 dark:accent-slate-100 h-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
