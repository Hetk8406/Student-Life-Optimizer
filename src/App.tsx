import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FeedbackProvider } from './components/FeedbackProvider'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { DashboardPage } from './pages/DashboardPage'
import { StudyPlannerPage } from './pages/StudyPlannerPage'
import { PerformancePage } from './pages/PerformancePage'
import { ExamsPage } from './pages/ExamsPage'
import { SkillsCareerPage } from './pages/SkillsCareerPage'
import { GoalsPage } from './pages/GoalsPage'
import { InsightsPage } from './pages/InsightsPage'
import { ProfilePage } from './pages/ProfilePage'
import { OnboardingPage } from './pages/OnboardingPage'

export default function App() {
  return (
    <FeedbackProvider>
      <BrowserRouter>
      <Routes>
        {/* public standalone pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* main app with sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planner" element={<StudyPlannerPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/skills" element={<SkillsCareerPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </FeedbackProvider>
  )
}
